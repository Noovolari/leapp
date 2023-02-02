import { TestBed } from "@angular/core/testing";

import { HttpClientService } from "./http-client.service";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";

describe("HttpClientService", () => {
  const httpClientMock: any = {};
  let httpClientService: HttpClientService;

  class TestData {
    constructor(public check: number) {}
  }

  beforeEach(() => {
    TestBed.configureTestingModule({}).overrideProvider(HttpClient, { useValue: httpClientMock });
    httpClientService = TestBed.inject(HttpClientService);
  });

  it("Post", async () => {
    const requestBody = { randomObj: 7 };
    const responseBody = new TestData(25);

    let urlCalled = "";
    let passedBody: any;
    httpClientMock.post = (url: string, body: any) => {
      urlCalled = url;
      passedBody = body;
      return of(responseBody);
    };

    const actualPromise = httpClientService.post<TestData>("/url", requestBody);
    expect(urlCalled).toEqual("/url");
    expect(passedBody).toEqual(requestBody);
    expect(await actualPromise).toEqual(responseBody);
  });

  it("Put", async () => {
    const requestBody = { randomObj: 7 };
    const responseBody = new TestData(25);

    let urlCalled = "";
    let passedBody: any;
    httpClientMock.put = (url: string, body: any) => {
      urlCalled = url;
      passedBody = body;
      return of(responseBody);
    };

    const actualPromise = httpClientService.put<TestData>("/url", requestBody);
    expect(urlCalled).toEqual("/url");
    expect(passedBody).toEqual(requestBody);
    expect(await actualPromise).toEqual(responseBody);
  });

  it("Get", async () => {
    const responseBody = new TestData(42);

    let urlCalled = "";
    httpClientMock.get = (url: string) => {
      urlCalled = url;
      return of(responseBody);
    };

    const actualPromise = httpClientService.get<TestData>("/url");
    expect(urlCalled).toEqual("/url");
    expect(await actualPromise).toEqual(responseBody);
  });
});
