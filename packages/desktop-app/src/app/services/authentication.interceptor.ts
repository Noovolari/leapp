import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { UserService } from "leapp-angular-common";

@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  constructor(private readonly userService: UserService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.userService.isSignedIn) {
      req = req.clone({ setHeaders: { ["Authorization"]: "Bearer " + this.userService.accessToken } });
    }

    return next.handle(req);
  }
}
