import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as uuid from "uuid";
import { IBehaviouralNotifier } from "../../../interfaces/i-behavioural-notifier";
import { IKeychainService } from "../../../interfaces/i-keychain-service";
import { INativeService } from "../../../interfaces/i-native-service";
import { IOpenExternalUrlService } from "../../../interfaces/i-open-external-url-service";
import { AwsConsoleLoginSession } from "../../../models/aws/aws-console-login-session";
import { constants } from "../../../models/constants";
import { CredentialsInfo } from "../../../models/credentials-info";
import { Session } from "../../../models/session";
import { AwsCoreService } from "../../aws-core-service";
import { AwsSigninOauthService, SigninTokenResponse } from "../../aws-signin-oauth.service";
import { FileService } from "../../file-service";
import { LoggedException, LogLevel } from "../../log-service";
import { Repository } from "../../repository";
import { AwsConsoleLoginSessionRequest } from "./aws-console-login-session-request";
import { AwsSessionService } from "./aws-session-service";

/**
 * Access token bundle persisted in the OS keychain. `dpopKey` is the PKCS#8 PEM
 * of the EC P-256 key the token is DPoP-bound to; losing it invalidates the
 * refresh token, so both are stored together.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9449#section-4.3
 */
interface ConsoleLoginToken {
  dpopKey: string;
  refreshToken: string;
  accessToken: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiresAt: string;
  };
}

interface CallbackListener {
  redirectUri: string;
  authorizationCodePromise: Promise<{ code: string }>;
  dispose: () => Promise<void>;
}

export class AwsConsoleLoginService extends AwsSessionService {
  private static readonly tokenKeySuffix = "-console-login-session-token";
  private static readonly refreshThresholdMs = 5 * 60 * 1000;
  private static readonly loginTimeoutMs = 5 * 60 * 1000;

  constructor(
    protected sessionNotifier: IBehaviouralNotifier,
    protected repository: Repository,
    fileService: FileService,
    private keychainService: IKeychainService,
    awsCoreService: AwsCoreService,
    private nativeService: INativeService,
    private openExternalUrlService: IOpenExternalUrlService,
    private awsSigninOauthService: AwsSigninOauthService
  ) {
    super(sessionNotifier, repository, awsCoreService, fileService);
  }

  async create(request: AwsConsoleLoginSessionRequest): Promise<void> {
    const session = new AwsConsoleLoginSession(request.sessionName, request.region, request.profileId, request.email);
    if (request.sessionId) {
      session.sessionId = request.sessionId;
    }

    this.repository.addSession(session);
    this.sessionNotifier?.setSessions(this.repository.getSessions());
  }

  async update(sessionId: string, updateRequest: AwsConsoleLoginSessionRequest): Promise<void> {
    const session = this.repository.getSessionById(sessionId) as AwsConsoleLoginSession;
    if (session) {
      session.sessionName = updateRequest.sessionName;
      session.region = updateRequest.region;
      session.profileId = updateRequest.profileId;
      session.email = updateRequest.email;

      this.repository.updateSession(sessionId, session);
      this.sessionNotifier?.setSessions(this.repository.getSessions());
    }
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsConsoleLoginSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      ["aws_access_key_id"]: credentialsInfo.sessionToken.aws_access_key_id,
      ["aws_secret_access_key"]: credentialsInfo.sessionToken.aws_secret_access_key,
      ["aws_session_token"]: credentialsInfo.sessionToken.aws_session_token,
      region: session.region,
    };
    return await this.fileService.iniWriteSync(this.awsCoreService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.repository.getSessionById(sessionId);
    const profileName = this.repository.getProfileName((session as AwsConsoleLoginSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.awsCoreService.awsCredentialPath());
    delete credentialsFile[profileName];
    await this.fileService.replaceWriteSync(this.awsCoreService.awsCredentialPath(), credentialsFile);
  }

  generateCredentialsProxy(sessionId: string): Promise<CredentialsInfo> {
    return this.generateCredentials(sessionId);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    const session = this.repository.getSessions().find((sess) => sess.sessionId === sessionId) as AwsConsoleLoginSession;
    if (session === undefined) {
      throw new LoggedException(`session with id ${sessionId} not found.`, this, LogLevel.warn);
    }

    let token = await this.loadToken(sessionId);

    if (!token) {
      token = await this.runInteractiveLogin(session);
    } else if (this.isAccessTokenExpiring(token)) {
      try {
        token = await this.refreshToken(session, token);
      } catch (_) {
        token = await this.runInteractiveLogin(session);
      }
    }

    this.saveSessionTokenExpirationInTheSession(session, new Date(token.accessToken.expiresAt));

    return this.credentialsInfoFromToken(token);
  }

  async getAccountNumberFromCallerIdentity(session: AwsConsoleLoginSession): Promise<string> {
    const credentialsInfo: CredentialsInfo = await this.generateCredentials(session.sessionId);
    const credentials = {
      ["SessionToken"]: credentialsInfo.sessionToken.aws_session_token,
      ["AccessKeyId"]: credentialsInfo.sessionToken.aws_access_key_id,
      ["SecretAccessKey"]: credentialsInfo.sessionToken.aws_secret_access_key,
    };
    const sts = new STSClient(this.awsCoreService.stsOptions(session, true, credentials));
    const response = await sts.send(new GetCallerIdentityCommand({}));
    return response.Account ?? "";
  }

  validateCredentials(sessionId: string): Promise<boolean> {
    return new Promise((resolve, _) => {
      this.generateCredentials(sessionId)
        .then((__) => {
          resolve(true);
        })
        .catch((__) => {
          resolve(false);
        });
    });
  }

  removeSecrets(sessionId: string): void {
    this.keychainService.deleteSecret(constants.appName, `${sessionId}${AwsConsoleLoginService.tokenKeySuffix}`).catch((_) => {
      // A missing keychain entry is fine; the session itself is already gone.
    });
  }

  async getCloneRequest(session: AwsConsoleLoginSession): Promise<AwsConsoleLoginSessionRequest> {
    throw new LoggedException(`Clone is not supported for sessionType ${session.type}`, this, LogLevel.error, false);
  }

  private async runInteractiveLogin(session: AwsConsoleLoginSession): Promise<ConsoleLoginToken> {
    const pkcePair = this.awsSigninOauthService.generatePkcePair();
    const dpopPrivateKeyPem = this.awsSigninOauthService.generateDpopKeyPair();
    const state = uuid.v4();
    const callbackListener = await this.startCallbackServer(state);
    try {
      const authorizeUrl = this.awsSigninOauthService.buildAuthorizeUrl(session.region, pkcePair.codeChallenge, callbackListener.redirectUri, state);
      this.openExternalUrlService.openExternalUrl(authorizeUrl);
      const { code } = await callbackListener.authorizationCodePromise;
      const tokenResponse = await this.awsSigninOauthService.exchangeAuthorizationCode(
        session.region,
        dpopPrivateKeyPem,
        code,
        callbackListener.redirectUri,
        pkcePair.codeVerifier
      );
      const token = this.tokenFromResponse(tokenResponse, dpopPrivateKeyPem);
      await this.saveToken(session.sessionId, token);
      return token;
    } finally {
      await callbackListener.dispose();
    }
  }

  private async refreshToken(session: AwsConsoleLoginSession, token: ConsoleLoginToken): Promise<ConsoleLoginToken> {
    const tokenResponse = await this.awsSigninOauthService.refreshAwsToken(session.region, token.dpopKey, token.refreshToken);
    const refreshedToken = this.tokenFromResponse(tokenResponse, token.dpopKey);
    await this.saveToken(session.sessionId, refreshedToken);
    return refreshedToken;
  }

  private tokenFromResponse(tokenResponse: SigninTokenResponse, dpopPrivateKeyPem: string): ConsoleLoginToken {
    return {
      dpopKey: dpopPrivateKeyPem,
      refreshToken: tokenResponse.refreshToken,
      accessToken: {
        accessKeyId: tokenResponse.accessToken.accessKeyId,
        secretAccessKey: tokenResponse.accessToken.secretAccessKey,
        sessionToken: tokenResponse.accessToken.sessionToken,
        expiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000).toISOString(),
      },
    };
  }

  private credentialsInfoFromToken(token: ConsoleLoginToken): CredentialsInfo {
    return {
      sessionToken: {
        ["aws_access_key_id"]: token.accessToken.accessKeyId.trim(),
        ["aws_secret_access_key"]: token.accessToken.secretAccessKey.trim(),
        ["aws_session_token"]: token.accessToken.sessionToken.trim(),
      },
    };
  }

  private isAccessTokenExpiring(token: ConsoleLoginToken): boolean {
    return new Date(token.accessToken.expiresAt).getTime() - Date.now() <= AwsConsoleLoginService.refreshThresholdMs;
  }

  private async loadToken(sessionId: string): Promise<ConsoleLoginToken | undefined> {
    try {
      const secret = await this.keychainService.getSecret(constants.appName, `${sessionId}${AwsConsoleLoginService.tokenKeySuffix}`);
      return secret ? (JSON.parse(secret) as ConsoleLoginToken) : undefined;
    } catch (_) {
      return undefined;
    }
  }

  private async saveToken(sessionId: string, token: ConsoleLoginToken): Promise<void> {
    await this.keychainService.saveSecret(constants.appName, `${sessionId}${AwsConsoleLoginService.tokenKeySuffix}`, JSON.stringify(token));
  }

  private async startCallbackServer(state: string): Promise<CallbackListener> {
    const http = this.nativeService.requireModule("http");
    let resolveCode: (value: { code: string }) => void;
    let rejectCode: (reason: Error) => void;
    const authorizationCodePromise = new Promise<{ code: string }>((resolve, reject) => {
      resolveCode = resolve;
      rejectCode = reject;
    });

    const server = http.createServer((request, response) => {
      const requestUrl = new URL(request.url, "http://127.0.0.1");
      if (requestUrl.pathname !== AwsSigninOauthService.callbackPath) {
        response.statusCode = 404;
        response.end();
        return;
      }
      const respondFailed = (message: string): void => {
        response.statusCode = 400;
        response.setHeader("Content-Type", "text/html");
        response.end(`<html><body><h3>Leapp login failed: ${message}.</h3></body></html>`);
        rejectCode(new LoggedException(`AWS Sign-In login failed: ${message}`, this, LogLevel.warn));
      };
      if (requestUrl.searchParams.get("state") !== state) {
        respondFailed("state mismatch");
        return;
      }
      const error = requestUrl.searchParams.get("error");
      if (error) {
        respondFailed(error);
        return;
      }
      const code = requestUrl.searchParams.get("code");
      if (!code) {
        respondFailed("missing authorization code");
        return;
      }
      response.statusCode = 200;
      response.setHeader("Content-Type", "text/html");
      response.end("<html><body><h3>Leapp login successful.</h3><p>You can close this window and go back to Leapp.</p></body></html>");
      resolveCode({ code });
    });

    const port = await new Promise<number>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => resolve(server.address().port));
    });

    const timeout = setTimeout(
      () => rejectCode(new LoggedException("AWS Sign-In login timed out: no authorization response received.", this, LogLevel.warn)),
      AwsConsoleLoginService.loginTimeoutMs
    );

    return {
      redirectUri: `http://127.0.0.1:${port}${AwsSigninOauthService.callbackPath}`,
      authorizationCodePromise,
      dispose: () => {
        clearTimeout(timeout);
        return new Promise<void>((resolve) => server.close(() => resolve()));
      },
    };
  }

  private saveSessionTokenExpirationInTheSession(session: Session, expiration: Date): void {
    const sessions = this.repository.getSessions();
    const index = sessions.indexOf(session);
    const currentSession: Session = sessions[index];

    if (expiration) {
      currentSession.sessionTokenExpiration = expiration.toISOString();
    }

    sessions[index] = currentSession;

    this.repository.updateSessions(sessions);
    this.sessionNotifier?.setSessions([...sessions]);
  }
}
