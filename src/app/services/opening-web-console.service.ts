import { Injectable } from '@angular/core';
import {AppService, LoggerLevel} from './app.service';
import {LoggingService} from './logging.service';
import {ExecuteService} from './execute.service';
import {AwsSessionService} from './session/aws/aws-session.service';
import {SessionService} from './session.service';
import {CredentialsInfo} from '../models/credentials-info';

@Injectable({
  providedIn: 'root'
})
export class OpeningWebConsoleService {

  constructor(
    private app: AppService,
    private loggingService: LoggingService,
    private exec: ExecuteService,
    private sessionService: AwsSessionService) {}

  async openingWebConsole(credentialsInfo: CredentialsInfo, sessionRegion: string, sessionDuration: number = 3200) {

    const federationUrl = 'https://signin.aws.amazon.com/federation';
    const consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;

    if(sessionRegion.startsWith('us-gov-') || sessionRegion.startsWith('cn-')) {
      throw new Error('Unsupported Region');
    }

    this.loggingService.logger(`Starting opening Web Console`, LoggerLevel.info, this);

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(JSON.stringify(sessionStringJSON))}`;

    const res = await fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${response.SigninToken}`;

    this.app.openExternalUrl(loginURL);
  }
}
