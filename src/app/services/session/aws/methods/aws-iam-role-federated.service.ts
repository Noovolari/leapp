import { Injectable } from '@angular/core';
import {AwsSessionService} from '../aws-session.service';
import {CredentialsInfo} from '../../../../models/credentials-info';
import {WorkspaceService} from '../../../workspace.service';
import {KeychainService} from '../../../keychain.service';
import {AppService} from '../../../app.service';
import {FileService} from '../../../file.service';
import {AwsIamRoleFederatedSession} from '../../../../models/aws-iam-role-federated-session';
import {LeappSamlError} from '../../../../errors/leapp-saml-error';
import {LeappParseError} from '../../../../errors/leapp-parse-error';
import {environment} from '../../../../../environments/environment';
import * as AWS from 'aws-sdk';
import {LeappAwsStsError} from '../../../../errors/leapp-aws-sts-error';

export interface AwsIamRoleFederatedSessionRequest {
  accountName: string;
  idpUrl: string;
  idpArn: string;
  roleArn: string;
  region: string;
}

export interface ResponseHookDetails {
  uploadData: { bytes: any[] }[];
}

@Injectable({
  providedIn: 'root'
})
export class AwsIamRoleFederatedService extends AwsSessionService {

  constructor(protected workspaceService: WorkspaceService,
              private keychainService: KeychainService,
              private appService: AppService,
              private fileService: FileService) {
    super(workspaceService);
  }

  static async extractSamlResponse(responseHookDetails: ResponseHookDetails) {
    let rawData = responseHookDetails.uploadData[0].bytes.toString();
    const n  = rawData.lastIndexOf('SAMLResponse=');
    const n2 = rawData.lastIndexOf('&RelayState=');
    rawData = n2 !== -1 ? rawData.substring(n + 13, n2) : rawData.substring(n + 13);
    return decodeURIComponent(rawData);
  }

  static sessionTokenFromGetSessionTokenResponse(assumeRoleResponse: AWS.STS.AssumeRoleWithSAMLResponse): { sessionToken: any } {
    return {
      sessionToken: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_access_key_id: assumeRoleResponse.Credentials.AccessKeyId.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_secret_access_key: assumeRoleResponse.Credentials.SecretAccessKey.trim(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        aws_session_token: assumeRoleResponse.Credentials.SessionToken.trim(),
      }
    };
  }

  create(sessionRequest: AwsIamRoleFederatedSessionRequest, profileId: string): void {
    const session = new AwsIamRoleFederatedSession(
      sessionRequest.accountName,
      sessionRequest.region,
      sessionRequest.idpUrl,
      sessionRequest.idpArn,
      sessionRequest.roleArn,
      profileId);
    this.workspaceService.addSession(session);
  }

  async applyCredentials(sessionId: string, credentialsInfo: CredentialsInfo): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialObject = {};
    credentialObject[profileName] = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_access_key_id: credentialsInfo.sessionToken.aws_access_key_id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_secret_access_key: credentialsInfo.sessionToken.aws_secret_access_key,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      aws_session_token: credentialsInfo.sessionToken.aws_session_token,
      region: session.region
    };
    return await this.fileService.iniWriteSync(this.appService.awsCredentialPath(), credentialObject);
  }

  async deApplyCredentials(sessionId: string): Promise<void> {
    const session = this.get(sessionId);
    const profileName = this.workspaceService.getProfileName((session as AwsIamRoleFederatedSession).profileId);
    const credentialsFile = await this.fileService.iniParseSync(this.appService.awsCredentialPath());
    delete credentialsFile[profileName];
    return await this.fileService.replaceWriteSync(this.appService.awsCredentialPath(), credentialsFile);
  }

  async generateCredentials(sessionId: string): Promise<CredentialsInfo> {
    // Get the sessions in question
    const session = this.get(sessionId);

    // Get idpUrl
    const idpUrl = this.workspaceService.getIdpUrl((session as AwsIamRoleFederatedSession).idpUrlId);

    // Check if we need to authenticate
    let needToAuthenticate;
    try {
      needToAuthenticate = await this.needAuthentication(idpUrl);
    } catch(err) {
      throw new LeappSamlError(this, err.message);
    }

    // AwsSignIn: retrieve the response hook
    let responseHookDetails;
    try {
      responseHookDetails = await this.awsSignIn(idpUrl, needToAuthenticate);
    } catch(err) {
      throw new LeappParseError(this, err.message);
    }

    // Extract SAML response from responseHookDetails
    let samlResponse;
    try {
      samlResponse = await AwsIamRoleFederatedService.extractSamlResponse(responseHookDetails);
    } catch(err) {
      throw new LeappParseError(this, err.message);
    }

    // Setup STS to generate the credentials
    const sts = new AWS.STS(this.appService.stsOptions(session));

    // Params for the calls
    const params = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      PrincipalArn: (session as AwsIamRoleFederatedSession).idpArn,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      RoleArn: (session as AwsIamRoleFederatedSession).roleArn,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      SAMLAssertion: samlResponse,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      DurationSeconds: environment.samlRoleSessionDuration,
    };

    // Invoke assumeRoleWithSAML
    let assumeRoleWithSamlResponse: AWS.STS.AssumeRoleWithSAMLResponse;
    try {
      assumeRoleWithSamlResponse = await sts.assumeRoleWithSAML(params).promise();
    } catch(err) {
      throw new LeappAwsStsError(this, err.message);
    }

    // Generate credentials
    return AwsIamRoleFederatedService.sessionTokenFromGetSessionTokenResponse(assumeRoleWithSamlResponse);
  }

  removeSecrets(sessionId: string): void {}

  private async needAuthentication(idpUrl: string): Promise<boolean> {
    return new Promise( (resolve, _) => {
      // Get active window position for extracting new windows coordinate
      const activeWindowPosition = this.appService.getCurrentWindow().getPosition();
      const nearX = 200;
      const nearY = 50;
      // Generate a new singleton browser window for the check
      let idpWindow = this.appService.newWindow(idpUrl, false, '', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);
      // This filter is used to listen to go to a specific callback url (or the generic one)
      const filter = {
        urls: [
          'https://*.onelogin.com/*',
          'https://*.okta.com/*',
          'https://accounts.google.com/ServiceLogin*',
          'https://login.microsoftonline.com/*',
          'https://signin.aws.amazon.com/saml'
        ]
      };

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        // G Suite
        if (details.url.indexOf('https://accounts.google.com/ServiceLogin') !== -1) {
          idpWindow = null;
          resolve(true);
        }
        // One Login
        if (details.url.indexOf('.onelogin.com/login') !== -1) {
          idpWindow = null;
          resolve(true);
        }
        // OKTA
        if (details.url.indexOf('.okta.com/discovery/iframe.html') !== -1) {
          idpWindow = null;
          resolve(true);
        }
        // AzureAD
        if (details.url.indexOf('https://login.microsoftonline.com') !== -1 && details.url.indexOf('/oauth2/authorize') !== -1) {
          idpWindow = null;
          resolve(true);
        }
        // Do not show window: already logged by means of sessions cookies
        if (details.url.indexOf('https://signin.aws.amazon.com/saml') !== -1) {
          idpWindow = null;
          resolve(false);
        }
        // Callback is used by filter to keep traversing calls until one of the filters apply
        callback({
          requestHeaders: details.requestHeaders,
          url: details.url,
        });
      });
      // Start the process
      idpWindow.loadURL(idpUrl);
    });
  }

  private async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    // 1. Show or not browser window depending on needToAuthenticate
    const activeWindowPosition = this.appService.getCurrentWindow().getPosition();
    const nearX = 200;
    const nearY = 50;
    // 2. Prepare browser window
    let idpWindow = this.appService.newWindow(idpUrl, needToAuthenticate, 'IDP - Login', activeWindowPosition[0] + nearX, activeWindowPosition[1] + nearY);
    // 3. Prepare filters and configure callback
    const filter = {urls: ['https://signin.aws.amazon.com/saml']};
    // Catch filter url: extract SAML response
    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    return new Promise( (resolve, _) => {
      idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        // it will throw an error as we have altered the original response
        // Setting that everything is ok if we have arrived here
        idpWindow.close();
        idpWindow = null;

        // Shut down the filter action: we don't need it anymore
        if (callback) {
          callback({cancel: true});
        }

        // Return the details
        resolve(details);
      });
      // 4. Navigate to idpUrl
      idpWindow.loadURL(idpUrl);
    });
  }
}
