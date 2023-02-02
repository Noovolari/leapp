import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class TestService {
  testUrl = `http://localhost/not-available/route`;

  constructor(private readonly httpClient: HttpClient) {}

  getTestUrl(): Observable<any> {
    return this.httpClient.get<any>(this.testUrl);
  }
}
