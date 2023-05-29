import { TestBed } from "@angular/core/testing";
import { AuthenticationInterceptor } from "./authentication.interceptor";
import { HTTP_INTERCEPTORS, HttpResponse, HttpClient } from "@angular/common/http";
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing";
import { TeamService } from "./team-service";

describe(`AuthenticationInterceptor`, () => {
  const testUrl = `http://localhost/not-available/route`;
  const teamServiceMock: any = {};
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthenticationInterceptor,
          multi: true,
        },
      ],
    }).overrideProvider(TeamService, { useValue: teamServiceMock });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("Intercept - user is not logged in", (done) => {
    teamServiceMock.signedInUserState = { getValue: jasmine.createSpy().and.callFake(() => null) };
    httpClient.get(testUrl).subscribe(() => {
      done();
    });

    const httpRequest = httpMock.expectOne(testUrl);
    expect(httpRequest.request.headers.has("Authorization")).toEqual(false);
    expect(teamServiceMock.signedInUserState.getValue).toHaveBeenCalled();
    httpRequest.event(new HttpResponse({ status: 200, body: {} }));
  });

  it("Intercept - user already logged in", (done) => {
    teamServiceMock.isSignedIn = true;
    teamServiceMock.signedInUserState = { getValue: jasmine.createSpy().and.callFake(() => ({ accessToken: "auth_token" })) };
    httpClient.get(testUrl).subscribe(() => {
      done();
    });

    const httpRequest = httpMock.expectOne(testUrl);
    expect(httpRequest.request.headers.has("Authorization")).toEqual(true);
    expect(httpRequest.request.headers.get("Authorization")).toBe("Bearer auth_token");
    httpRequest.event(new HttpResponse({ status: 200, body: {} }));
  });
});
