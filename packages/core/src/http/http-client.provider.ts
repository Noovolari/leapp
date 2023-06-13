import axios, { AxiosRequestConfig } from "axios";
import { IHttpClient } from "../interfaces/i-http-client";

export class HttpClientProvider implements IHttpClient {
  private _accessToken: string;

  constructor() {}

  get accessToken(): string {
    return this._accessToken;
  }

  set accessToken(value: string) {
    this._accessToken = value;
  }

  async get<T>(url: string): Promise<T> {
    return (await axios.get<T>(url, this.getHttpHeaders())).data;
  }

  async post<T>(url: string, body: any): Promise<T> {
    return (await axios.post<T>(url, body, this.getHttpHeaders())).data;
  }

  async put<T>(url: string, body: any): Promise<T> {
    return (await axios.put<T>(url, body, this.getHttpHeaders())).data;
  }

  async delete<T>(url: string): Promise<T> {
    return (await axios.delete<T>(url, this.getHttpHeaders())).data;
  }

  private getHttpHeaders(): AxiosRequestConfig {
    return { headers: { ["Authorization"]: `Bearer ${this.accessToken}` } };
  }
}
