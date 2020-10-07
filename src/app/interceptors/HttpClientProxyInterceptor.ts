import {Injectable} from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent } from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class HttpClientProxyInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    console.log('REQUEST: ', req);
    console.log('REQUEST URL: ', req.url);
    const requestClone = req.clone({
      setHeaders: { 'X-Forwarded-For': 'https://accounts.google.com' },
      url: 'https://34.242.151.101:3128' + '/o/saml2/initsso?idpid=C03eqis8s&spid=1033946587263&forceauthn=false'
    });
    console.log('REQUEST CLONE: ', requestClone);
    return next.handle(requestClone);
  }
}
