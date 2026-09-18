import { INativeService } from "../interfaces/i-native-service";
import * as uuid from "uuid";

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

export interface SigninTokenInput {
  clientId: string;
  grantType: "authorization_code" | "refresh_token";
  code?: string;
  redirectUri?: string;
  codeVerifier?: string;
  refreshToken?: string;
}

export interface SigninTokenResponse {
  accessToken: { accessKeyId: string; secretAccessKey: string; sessionToken: string };
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  idToken?: string;
}

export type SigninOAuthErrorCode = "TOKEN_EXPIRED" | "USER_CREDENTIALS_CHANGED" | "INSUFFICIENT_PERMISSIONS" | "UNKNOWN";

export class AwsSigninOAuthError extends Error {
  constructor(public errorCode: SigninOAuthErrorCode, message: string) {
    super(message);
  }
}

/**
 * Client for the publicly documented AWS Sign-In OAuth 2.0 endpoints
 * (https://docs.aws.amazon.com/signin/latest/userguide/oauth-sign-in-overview.html).
 * Implements the authorization code flow with PKCE and the refresh token flow,
 * both authenticated with a DPoP proof bound to an EC P-256 key pair.
 *
 * @see https://docs.aws.amazon.com/signin/latest/userguide/oauth-sign-in-overview.html
 * @see https://datatracker.ietf.org/doc/html/rfc7636 (PKCE)
 * @see https://datatracker.ietf.org/doc/html/rfc9449 (DPoP)
 */
export class AwsSigninOauthService {
  static readonly sameDeviceClientId = "arn:aws:signin:::devtools/same-device";
  static readonly authorizePath = "/v1/authorize";
  static readonly tokenPath = "/v1/token";
  static readonly callbackPath = "/oauth/callback";

  constructor(private nativeService: INativeService) {}

  oauthBaseUrl(region: string): string {
    return `https://${region}.oauth.signin.aws`;
  }

  buildAuthorizeUrl(region: string, codeChallenge: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams();
    params.append("client_id", AwsSigninOauthService.sameDeviceClientId);
    params.append("code_challenge", codeChallenge);
    params.append("code_challenge_method", "SHA-256");
    params.append("redirect_uri", redirectUri);
    params.append("response_type", "code");
    params.append("scope", "openid");
    params.append("state", state);
    return `${this.oauthBaseUrl(region)}${AwsSigninOauthService.authorizePath}?${params.toString()}`;
  }

  generatePkcePair(): PkcePair {
    const codeVerifier = this.toBase64Url(this.nativeService.crypto.randomBytes(48));
    const codeChallenge = this.toBase64Url(this.nativeService.crypto.createHash("sha256").update(codeVerifier).digest());
    return { codeVerifier, codeChallenge };
  }

  /**
   * Generates the EC P-256 private key (PKCS#8 PEM) the login token will be
   * DPoP-bound to. The public counterpart is derived from it when signing.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc9449
   */
  generateDpopKeyPair(): string {
    const { privateKey } = this.nativeService.crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    return privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  }

  exchangeAuthorizationCode(
    region: string,
    dpopPrivateKeyPem: string,
    code: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<SigninTokenResponse> {
    const tokenInput: SigninTokenInput = {
      clientId: AwsSigninOauthService.sameDeviceClientId,
      grantType: "authorization_code",
      code,
      redirectUri,
      codeVerifier,
    };
    return this.createToken(region, dpopPrivateKeyPem, tokenInput);
  }

  refreshAwsToken(region: string, dpopPrivateKeyPem: string, refreshToken: string): Promise<SigninTokenResponse> {
    const tokenInput: SigninTokenInput = {
      clientId: AwsSigninOauthService.sameDeviceClientId,
      grantType: "refresh_token",
      refreshToken,
    };
    return this.createToken(region, dpopPrivateKeyPem, tokenInput);
  }

  private async createToken(region: string, dpopPrivateKeyPem: string, tokenInput: SigninTokenInput): Promise<SigninTokenResponse> {
    const url = `${this.oauthBaseUrl(region)}${AwsSigninOauthService.tokenPath}`;
    const response = await this.nativeService.fetch(url, {
      method: "post",
      // eslint-disable-next-line @typescript-eslint/naming-convention -- wire header names are fixed by the OAuth2/DPoP specs
      headers: { "Content-Type": "application/json", DPoP: this.buildDpopToken(dpopPrivateKeyPem, url) },
      body: JSON.stringify(tokenInput),
    });

    if (!response.ok) {
      let errorCode: SigninOAuthErrorCode = "UNKNOWN";
      let message = `AWS Sign-In token request failed with status ${response.status}`;
      try {
        const body = await response.json();
        if (body && body.error) {
          errorCode = body.error;
          message = body.error_description ?? body.message ?? message;
        }
      } catch (_) {}
      throw new AwsSigninOAuthError(errorCode, message);
    }

    return (await response.json()) as SigninTokenResponse;
  }

  private buildDpopToken(privateKeyPem: string, url: string): string {
    const crypto = this.nativeService.crypto;
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    const jwk = crypto.createPublicKey(privateKey).export({ format: "jwk" });
    const header = { typ: "dpop+jwt", alg: "ES256", jwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } };
    const payload = { htm: "POST", htu: url, iat: Math.floor(Date.now() / 1000), jti: uuid.v4() };
    const signingInput = `${this.toBase64Url(Buffer.from(JSON.stringify(header)))}.${this.toBase64Url(Buffer.from(JSON.stringify(payload)))}`;
    const derSignature = crypto.sign("sha256", Buffer.from(signingInput), privateKey);
    return `${signingInput}.${this.toBase64Url(this.ecdsaDerSignatureToRaw(derSignature))}`;
  }

  /**
   * Converts an ASN.1 DER encoded ECDSA signature (as returned by node's crypto.sign)
   * to the raw r||s concatenation of two 32-byte values required by ES256 (RFC 7518).
   * DER INTEGERs carry a leading 0x00 sign byte when the value's high bit is set
   * (so r/s may be 33 bytes long); that byte is stripped before concatenation.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc7518#section-3.4
   * @see https://nodejs.org/api/crypto.html#cryptosignalgorithm-data-key
   */
  private ecdsaDerSignatureToRaw(derSignature: Buffer): Buffer {
    if (derSignature[0] !== 0x30) {
      throw new Error("Invalid DER signature: missing SEQUENCE tag");
    }
    let offset = 2;
    if (derSignature[offset] !== 0x02) {
      throw new Error("Invalid DER signature: missing INTEGER tag for r");
    }
    const rLength = derSignature[offset + 1];
    let r = derSignature.slice(offset + 2, offset + 2 + rLength);
    offset += 2 + rLength;
    if (derSignature[offset] !== 0x02) {
      throw new Error("Invalid DER signature: missing INTEGER tag for s");
    }
    const sLength = derSignature[offset + 1];
    let s = derSignature.slice(offset + 2, offset + 2 + sLength);
    const stripSignByte = (value: Buffer): Buffer => (value.length > 32 && value[0] === 0x00 ? value.subarray(1) : value);
    r = stripSignByte(r);
    s = stripSignByte(s);
    if (r.length > 32 || s.length > 32) {
      throw new Error("Invalid DER signature: value longer than 32 bytes");
    }
    const rawSignature = Buffer.alloc(64);
    r.copy(rawSignature, 32 - r.length);
    s.copy(rawSignature, 64 - s.length);
    return rawSignature;
  }

  private toBase64Url(buffer: Buffer): string {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
}
