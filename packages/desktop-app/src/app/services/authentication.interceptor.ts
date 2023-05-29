import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { TeamService } from "./team-service";

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor(private readonly teamService: TeamService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.teamService.signedInUserState.getValue()) {
      req = req.clone({ setHeaders: { ["Authorization"]: "Bearer " + this.teamService.signedInUserState.getValue().accessToken } });
    }

    return next.handle(req);
  }
}
