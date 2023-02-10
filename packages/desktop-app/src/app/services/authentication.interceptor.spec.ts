import { TestBed } from "@angular/core/testing";

import { AuthenticationInterceptor } from "./authentication.interceptor";
import { HTTP_INTERCEPTORS, HttpResponse } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TestService, UserService } from "leapp-angular-common";

describe(`AuthenticationInterceptor`, () => {
  const userServiceMock: any = {};
  let testService: TestService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TestService,
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthenticationInterceptor,
          multi: true,
        },
      ],
    }).overrideProvider(UserService, { useValue: userServiceMock });

    testService = TestBed.inject(TestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("Intercept - user is not logged in", (done) => {
    userServiceMock.isSignedIn = false;
    testService.getTestUrl().subscribe(() => {
      done();
    });

    const httpRequest = httpMock.expectOne(testService.testUrl);
    expect(httpRequest.request.headers.has("Authorization")).toEqual(false);
    httpRequest.event(new HttpResponse({ status: 200, body: {} }));
  });

  it("Intercept - user already logged in", (done) => {
    userServiceMock.isSignedIn = true;
    userServiceMock.getAuthenticationToken = () => "auth_token";
    testService.getTestUrl().subscribe(() => {
      done();
    });

    const httpRequest = httpMock.expectOne(testService.testUrl);
    expect(httpRequest.request.headers.has("Authorization")).toEqual(true);
    expect(httpRequest.request.headers.get("Authorization")).toBe("Bearer auth_token");
    httpRequest.event(new HttpResponse({ status: 200, body: {} }));
  });
});
