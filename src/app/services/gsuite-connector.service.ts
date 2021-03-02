import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';

import {GSuiteAuthFirstStepRequestDto} from '../models/gsuite-connector/gsuite-auth-first-step-request-dto';
import {GsuiteAuthFirstStepResponseDto} from '../models/gsuite-connector/gsuite-auth-first-step-response-dto';
import {GSuiteAuthSecondStepRequestDto} from '../models/gsuite-connector/gsuite-auth-second-step-request-dto';
import {Observable} from 'rxjs';
import {GsuiteAuthSecondStepResponseDto} from '../models/gsuite-connector/gsuite-auth-second-step-response-dto';
import {MessageAndDataResponseDto} from '../models/gsuite-connector/message-and-data-response-dto';
import {GsuiteAuthThirdStepRequestDto} from '../models/gsuite-connector/gsuite-auth-third-step-request-dto';
import {NativeService} from '../services-system/native-service';

@Injectable({
  providedIn: 'root'
})
export class GsuiteConnectorService extends NativeService {

  firstStepUrl = 'http://localhost:8080/api/v1/g_suite_auth/first_step';
  secondStepUrl = 'http://localhost:8080/api/v1/g_suite_auth/second_step';
  thirdStepUrl = 'http://localhost:8080/api/v1/g_suite_auth/third_step';

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type':  'application/json', 'Response-Type': 'json' })
  };

  constructor(private http: HttpClient) {
    super();
  }

  sendFirstRequest(dto: GSuiteAuthFirstStepRequestDto): Observable<GsuiteAuthFirstStepResponseDto> {
    return this.http.post<GsuiteAuthFirstStepResponseDto>(this.firstStepUrl, dto, this.httpOptions);
  }

  sendSecondRequest(captcha: string, password: string, dto: GsuiteAuthFirstStepResponseDto): Observable<GsuiteAuthSecondStepResponseDto> {
    const dtoSecondStep: GSuiteAuthSecondStepRequestDto = {
      Captcha: captcha,
      CaptchaInputId: dto.CaptchaInputId,
      CaptchaUrl: dto.CaptchaURL,
      CaptchaForm: dto.CaptchaForm,
      Password: password,
      LoginForm: dto.LoginForm,
      LoginUrl: dto.LoginURL
    };
    return this.http.post<GsuiteAuthSecondStepResponseDto>(this.secondStepUrl, dtoSecondStep);
  }

  sendThirdRequest(token: string, dto: GsuiteAuthSecondStepResponseDto): Observable<MessageAndDataResponseDto> {
    const dtoThirdStep: GsuiteAuthThirdStepRequestDto = {
      IsMfaTokenRequested: dto.IsMfaTokenRequested,
      ResponseForm: dto.ResponseForm,
      SubmitURL: dto.SubmitURL,
      Token: token
    };
    return this.http.post<MessageAndDataResponseDto>(this.thirdStepUrl, dtoThirdStep);
  }

}
