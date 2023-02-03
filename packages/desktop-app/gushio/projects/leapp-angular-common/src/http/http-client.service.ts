import { Injectable } from "@angular/core";
import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { HttpClientInterface } from "leapp-team-core/http/HttpClientInterface";

export interface Options {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  context?: HttpContext;
  observe?: "body";
  params?:
    | HttpParams
    | {
        [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
      };
  reportProgress?: boolean;
  responseType?: "json";
  withCredentials?: boolean;
}

@Injectable({ providedIn: "root" })
export class HttpClientService implements HttpClientInterface {
  constructor(private readonly httpClient: HttpClient) {}

  static fillDefaultOptions(): Options {
    return { headers: new HttpHeaders().set("Content-Type", "application/json") };
  }

  async post<T>(url: string, body: any | null): Promise<T> {
    return this.httpClient.post<T>(url, body, HttpClientService.fillDefaultOptions()).toPromise();
  }

  async put<T>(url: string, body: any | null): Promise<T> {
    return this.httpClient.put<T>(url, body, HttpClientService.fillDefaultOptions()).toPromise();
  }

  async get<T>(url: string): Promise<T> {
    return this.httpClient.get<T>(url, HttpClientService.fillDefaultOptions()).toPromise();
  }

  async delete<T>(url: string): Promise<T> {
    return this.httpClient.delete<T>(url, HttpClientService.fillDefaultOptions()).toPromise();
  }
}
