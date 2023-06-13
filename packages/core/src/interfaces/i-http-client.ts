export interface IHttpClient {
  post<T>(url: string, body: any | null): Promise<T>;

  put<T>(url: string, body: any | null): Promise<T>;

  get<T>(url: string): Promise<T>;

  delete<T>(url: string): Promise<T>;
}
