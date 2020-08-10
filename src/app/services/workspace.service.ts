import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {AppService, LoggerLevel, ToastLevel} from '../services-system/app.service';
import {NativeService} from '../services-system/native-service';
import {ConfigurationService} from '../services-system/configuration.service';
import {AwsCredential, AwsCredentials} from '../models/credential';
import {Workspace} from '../models/workspace';
import {Observable, of} from 'rxjs';
import {environment} from '../../environments/environment';
import {catchError, switchMap, tap} from 'rxjs/operators';

// Import AWS node style
const AWS = require('aws-sdk');

export enum SessionStatus {
  START,
  STOP,
  ERROR
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService extends NativeService {

  // timeout for get configuration
  timeout;

  // A class reference to the idp window
  idpWindow;

  // Update Session to backend Emitter
  public sentSessionUpdateEvent: EventEmitter<{accountName: string, status: SessionStatus, message: string}> = new EventEmitter<{accountName: string, status: SessionStatus, message: string}>();

  // Email change Emitter
  public emailEmit: EventEmitter<string> = new EventEmitter<string>();

  // First Time Google Token obtained
  public googleEmit: EventEmitter<string> = new EventEmitter<string>();

  // Credential refreshed
  public credentialEmit: EventEmitter<{status: string, accountName: string}> = new EventEmitter<{status: string, accountName: string}>();

  constructor(
    private httpClient: HttpClient,
    private appService: AppService,
    private configurationService: ConfigurationService
  ) {
    super();
  }

  /* ====================================== */
  /* =========< IDP MANAGEMENTS >========== */
  /* ====================================== */

  /**
   * Get the Idp Token to save, in the MVP case the SAML response
   * @param idpUrl - the idp url that is given by the backend
   * @param account - the account to link the request to when setting the credentials directly
   * @param role - the role that we want to assume after getting the credentials
   * @param type - the Idp Response Type of the request
   * @param callbackUrl - the callback url that can be given always by the backend in case is missing we setup a default one
   */
  getIdpToken(idpUrl: string, account: any, role: string, type: string, callbackUrl?: string) {
    this.checkForShowingTheLoginWindow(idpUrl).subscribe(res => {
      // We generate a new browser window to host for the Idp Login form
      // Note: this is due to the fact that electron + angular gives problem with embedded webview
      const pos = this.currentWindow.getPosition();

      try {
        this.idpWindow.close();
      } catch (err) {}

      this.idpWindow = this.appService.newWindow(idpUrl, res, 'IDP - Login', pos[0] + 200, pos[1] + 50);

      // This filter is used to listen to go to a specific callback url (or the generic one)
      const filter = {urls: ['https://signin.aws.amazon.com/saml']};

      // Our request filter call the generic hook filter passing the idp response type
      // to construct the ideal method to deal with the construction of the response
      this.idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        this.idpResponseHook(details, type, idpUrl, account.accountNumber, role, callback);
      });

      this.idpWindow.loadURL(idpUrl);
    }, err => {
      if (this.idpWindow !== undefined && this.idpWindow !== null) {
        try {
          this.idpWindow.close();
        } catch (e) {
          this.appService.logger(e, LoggerLevel.ERROR);
        }
      }

      // Sometimes it can arrive here (tested) so the REAL way to block everiything no is use the credential emit element!!!
      this.credentialEmit.emit({status: err.stack, accountName: account.accountName});
      throw new Error(err);
    });
  }

  /**
   * Get the Idp Token to save, than save it for later, just the first time
   * This is used in the setup fase
   * @param idpUrl - the idp url that is given by the backend
   * @param type - the Idp Response Type of the request
   * @param callbackUrl - the callback url that can be given always by the backend in case is missing we setup a default one
   */
  getIdpTokenInSetup(idpUrl: string, type: string, callbackUrl?: string) {

    // We generate a new browser window to host for the Idp Login form
    // Note: this is due to the fact that electron + angular gives problem with embedded webview
    const pos = this.currentWindow.getPosition();
    this.idpWindow = this.appService.newWindow(idpUrl, true, 'IDP - Login', pos[0] + 200, pos[1] + 50);

    // This filter is used to listen to go to a specific callback url (or the generic one)
    const filter = {urls: ['https://signin.aws.amazon.com/saml']};

    // Our request filter call the generic hook filter passing the idp response type
    // to construct the ideal method to deal with the construction of the response
    this.idpWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
      this.idpResponseHookFirstTime(details, type, idpUrl, callback);
    });

    this.httpClient.get('https://mail.google.com/mail/u/0/?logout&hl=en').subscribe(() => {
    }, () => {
      this.idpWindow.loadURL(idpUrl);
    });
  }

  refreshSessionUpdateToBackend(accountName: string) {
    return of(null);
  }

  /**
   * Send and update on the session status to our backend
   * @param accountName - the account name to update
   */
  sendSessionUpdateToBackend(accountName: string) {
    this.refreshSessionUpdateToBackend(accountName).subscribe();
  }

  /**
   * Credential refresh method, it cals for the entire procedure to obtain a
   * valid session token to make the assumeRoleWithSAML
   * @param idpUrl - url to use to connect to the idp
   * @param accountNumber - the account number chosen for the credential to refresh
   * @param role - the role selected
   */
  refreshCredentials(idpUrl: string, account: any, role: string) {
    // Extract the Idp token passing the type of request, this method has
    // become generic so we can already prepare for multiple idp type
    this.getIdpToken(idpUrl, account, role, IdpResponseType.SAML, null);
  }

  /**
   * Check if we need to show the Login window for Google or not
   * @returns - {boolean} the result of the check if we need to show the Google login window again
   */
  checkForShowingTheLoginWindow(url): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.httpClient.get(url).subscribe(() => {
        console.log();
      }, err => {
        console.log();
        if (err.status === 500 || err.error.text === undefined) {
          observer.error('There was a problem with your connection. Please retry.');
          observer.complete();
        } else {
          if (err.error.text.indexOf('net::ERR_NETWORK_CHANGED') > -1 ||
            err.error.text.indexOf('net::ERR_NAME_NOT_RESOLVED') > -1 ||
            err.error.text.indexOf('net::ERR_INTERNET_DISCONNECTED') > -1 ||
            err.error.text.indexOf('net::ERR_NETWORK_IO_SUSPENDED') > -1) {
            observer.error('There was a problem with your connection. Please retry.');
            observer.complete();
          } else {
            observer.next(err.error.text.indexOf('Forwarding ...') === -1);
            observer.complete();
          }
        }
      });
    });
  }

  /**
   * Generic response hook, this one is used to generally retrieve a response from an idp Url.
   * @param details - the detail of the response for the call to the idp url
   * @param type - the type of response for example SAML using the IdpResponseType.SAML
   * @param idpUrl - the SSO url
   * @param accountNumber - the account number to obtain credentials with
   * @param role - the role to obtain credentials with
   * @param callback - eventual callback to call with the response data
   */
  idpResponseHook(details: any, type: string, idpUrl: string, accountNumber: string, role: string, callback?: any) {
    // Extract the token from the request and set the email for the screen
    const token = this.extract_SAML_Response(details);

    console.log(token);

    // Set the hook email
    this.setHookEmail(token, type);

    // Before doing anything we also need to authenticate VERSUS Cognito to our backend
    const workspace = this.configurationService.getDefaultWorkspaceSync();
    workspace.type = type;
    workspace.lastIDPToken = token;
    workspace.idpUrl  = idpUrl;

    // Now we can go on
    this.configurationService.updateWorkspaceSync(workspace);

    // this is ok for now so we can save it and call sts assume role
    this.obtainCredentials(workspace, accountNumber, role, () => {
      // it will throw an error as we have altered the original response
      // Setting that everything is ok if we have arrived here
      this.idpWindow.close();
    });

    // Close the window we don't need it anymore because otherwise
    if (callback) {
      callback({cancel: true});
    }
  }

  /**
   * Specific response hook for the first setup, this one is used to generally retrieve a response from an idp Url.
   * @param details - the detail of the response for the call to the idp url
   * @param type - the type of response for example SAML using the IdpResponseType.SAML
   * @param idpUrl - we save it
   * @param callback - eventual callback to call with the response data
   */
  idpResponseHookFirstTime(details: any, type: string, idpUrl: string, callback?: any) {
    // Extract the token from the request and set the email for the screen
    const token = this.extract_SAML_Response(details);

    // Set the hook email
    this.setHookEmail(token, type);

    // Close Idp Window and emit a specific event for the page that subscribe
    // to this specific reduced version of the get credentials method
    this.googleEmit.emit(token);
    this.idpWindow.close();


    // Close the window we don't need it anymore because otherwise
    if (callback) {
      callback({cancel: true});
    }
  }

  /* ====================================== */
  /* =======< RESPONSE EXTRACTORS >======== */
  /* ====================================== */

  /**
   * Set the hook email based on response type
   */
  setHookEmail(token, type) {

    const samlData = atob(token);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(samlData, 'text/xml');
    const email = xmlDoc.getElementsByTagName('saml2p:Response')[0].getElementsByTagName('saml2:Assertion')[0].getElementsByTagName('saml2:Subject')[0].getElementsByTagName('saml2:NameID')[0].childNodes[0].nodeValue;
    localStorage.setItem('hook_email', email);
    this.emailEmit.emit(email);
  }

  /**
   * Extract the saml response from the request detail this will be part of a more structured
   * data retrieve method in order to define different possible retrieval method based on
   * possible different idp
   * @param requestDetails - the detail of the requyest retrieved bny the getIdp call
   * @returns the decoded saml response
   */
  extract_SAML_Response(requestDetails: any) {
    const rawData = requestDetails.uploadData[0].bytes.toString('utf8');

    console.log();

    const n  = rawData.lastIndexOf('SAMLResponse=');
    const n2 = rawData.lastIndexOf('&RelayState=');
    return decodeURIComponent(rawData.substring(n + 13, n2));
  }

  obtainCredentials(workspace: Workspace, account: string, role: string, callback?: any) {
    switch (workspace.type) {
      case IdpResponseType.SAML:
        this.obtainCredentialsWithSAML({ accountNumber: account, roleId: role }, workspace, callback);
        break;
    }
  }

  /**
   * Define how to set and obtain credentials with SAML once you have setup everything correctly,
   * this is a construction of the generic method and here we define the structure of the object.
   * The *obtainerObject* is defined like so:
   *
   * Callback is defined here if we want to do something after SAML gives us the credentials
   * @param obtainerObject - the object that will obtain credentials
   * @param workspace - the workspace with you are making the request
   * @param callback - the callback to use
   */
  obtainCredentialsWithSAML(obtainerObject: any, workspace: Workspace, callback?: any) {

    // Setup STS to generate the credentials
    const sts = new AWS.STS();

    let parentAccount;
    let parentRole;
    const selectedAccount = workspace.accountRoleMapping.accounts.filter(account => account.accountNumber === obtainerObject.accountNumber)[0];
    const selectedRole = selectedAccount.awsRoles.filter(role => role.name === obtainerObject.roleId)[0];
    const roleName = selectedRole.name;

    // console.log(obtainerObject);
    // console.log(workspace.lastIDPToken);

    if (selectedAccount.parent || selectedRole.parent) {
      const selectedElement = selectedAccount.parent || selectedRole.parent;
      const selectedParentRole = selectedAccount.parentRole || selectedRole.parentRole;
      parentAccount = workspace.accountRoleMapping.accounts.filter(account => selectedElement === account.accountNumber)[0];
      parentRole = parentAccount.awsRoles.filter(role => role.name === selectedParentRole)[0];
    }

    const idpArn = parentAccount ? parentAccount.idpArn : selectedAccount.idpArn;

    const federatedRoleArn = `arn:aws:iam::${parentAccount ? parentAccount.accountNumber : selectedAccount.accountNumber}:role/${parentRole ? parentRole.name : roleName}`;

    // Params for the calls
    const params = {
      PrincipalArn: idpArn,
      RoleArn: federatedRoleArn,
      SAMLAssertion: workspace.lastIDPToken,
      DurationSeconds: 3600,
    };

    // We try to assume role with SAML which will give us the temporary credentials for one hour
    sts.assumeRoleWithSAML(params, (err, data: any) => {
      if (err) {
        // Something went wrong save it to the logger file
        this.appService.logger(err.code, LoggerLevel.ERROR);
        this.appService.logger(err.stack, LoggerLevel.ERROR);
        this.appService.toast('There was a problem assuming role with SAML, please retry', ToastLevel.WARN);

        // Emit ko
        this.credentialEmit.emit({status: err.stack, accountName: null});

        // If we have a callback call it
        if (callback) {
          callback(data);
        }
      } else {
        // Save credentials as default in .aws/credentials and in the workspace as default ones
        this.saveCredentialsInFileAndDefaultWorkspace(data, workspace, parentAccount !== undefined, selectedAccount, roleName);

        // If we have a callback call it
        if (callback) {
          callback(data);
        }
      }
    });
  }

  /**
   * Save and update both Default Workspace and credential file
   * @param stsResponse - the STS reposnse
   * @param workspace - the workspace we want to use to inject the credentials and make it default
   * @param isDoubleJump - check if the double jump have to be used
   * @param account - the account of the requester
   * @param roleName - the role name of the requester
   */
  saveCredentialsInFileAndDefaultWorkspace(stsResponse: any, workspace: Workspace, isDoubleJump, account, roleName) {
    // Construct the credential object
    try {
      // Construct actual credentials
      workspace.awsCredentials = this.constructCredentialObjectFromStsResponse(stsResponse, workspace, account.accountNumber);

      // Save the federated one
      this.configurationService.updateWorkspaceSync(workspace);
    } catch (err) {
      this.appService.logger(err, LoggerLevel.ERROR);
      this.appService.toast(err, ToastLevel.ERROR);

      // Emit ko
      this.credentialEmit.emit({status: err.stack, accountName: account.accountName});
    }

    // Write in aws credential file and workspace
    try {
      if (isDoubleJump) {
        // Make second jump: credentials are the first one now
        AWS.config.update({
          sessionToken: workspace.awsCredentials.default.aws_session_token,
          accessKeyId: workspace.awsCredentials.default.aws_access_key_id,
          secretAccessKey: workspace.awsCredentials.default.aws_secret_access_key
        });

        const sts = new AWS.STS();
        sts.assumeRole({
          RoleArn: `arn:aws:iam::${account.accountNumber}:role/${roleName}`,
          RoleSessionName: `truster-on-${roleName}`
        }, (err, data: any) => {
          if (err) {

            // Something went wrong save it to the logger file
            this.appService.logger(err.stack, LoggerLevel.ERROR);
            this.appService.toast('There was a problem assuming role, please retry', ToastLevel.WARN);
            // Emit ko for double jump
            this.credentialEmit.emit({status: err.stack, accountName: account.accountName});
          } else {

            // we set the new credentials after the first jump
            const credentials: AwsCredentials = this.constructCredentialObjectFromStsResponse(data, workspace, account.accountNumber);
            workspace.awsCredentials = credentials;
            this.configurationService.updateWorkspaceSync(workspace);

            // Emit ok for double jump
            this.credentialEmit.emit({status: 'ok', accountName: account.accountName});
          }
        });
      } else {

        // Emit ok for single jump
        this.credentialEmit.emit({status: 'ok', accountName: account.accountName});
      }
    } catch (err) {
      this.appService.logger(err, LoggerLevel.ERROR);
      this.appService.toast(err, ToastLevel.ERROR);

      // Emit ko
      this.credentialEmit.emit({status: err.stack, accountName: account.accountName});
    }
  }

  /**
   * For simplicity we have a method that can help us extract and compose a credential object whenever we want
   * @param stsResponse - the STS response from an STs client object getTemporaryCredentials of any type
   * @param workspace - the workspace tf the request
   * @param accountNumber - the accountNumber of the request to obtain the sts token
   * @returns an object of type {AwsCredential}
   */
  constructCredentialObjectFromStsResponse(stsResponse: any, workspace: Workspace, accountNumber: string): AwsCredentials {

    // Get account and check for region request
    const account = workspace.accountRoleMapping.accounts.filter(acc => acc.accountNumber === accountNumber)[0];
    const region = account.region;

    // these are the standard STS response types
    const accessKeyId = stsResponse.Credentials.AccessKeyId;
    const secretAccessKey = stsResponse.Credentials.SecretAccessKey;
    const sessionToken = stsResponse.Credentials.SessionToken;

    // Construct the credential object
    const credential: AwsCredential = {};
    credential.aws_access_key_id = accessKeyId;
    credential.aws_secret_access_key = secretAccessKey;
    credential.aws_session_token = sessionToken;

    if (region && region !== 'no region necessary') {
      credential.region = region;
    }

    // Return it!
    return {default: credential};
  }

  /* ====================================== */
  /* ======< WORKSPACE MANAGEMENTS >======= */
  /* ====================================== */

  createNewWorkspace(googleToken: string, federationUrl: string, name: string, responseType: string) {
    try {
      // Create a standard workspace to use as default
      const workspace: Workspace = {
        type: responseType,
        name,
        lastIDPToken: googleToken,
        idpUrl: federationUrl,
        principalAccountNumber: null,
        accountRoleMapping: {accounts: []},
        currentSessionList: []
      };
      // Save and set as default
      this.configurationService.addWorkspaceSync(workspace);
      this.configurationService.setDefaultWorkspaceSync(workspace.name);
      // Clean localStorage we don't need it anymore
      localStorage.removeItem('workspace');
      // did it!
      return true;
    } catch (err) {

      // Catch any error show it and return false
      this.appService.toast(err, ToastLevel.WARN, 'Create new workspace');
      this.appService.logger(err, LoggerLevel.WARN);
      return false;
    }
  }
}

export enum IdpResponseType {
  SAML = 'SAML'
}

