export interface HttpClientInterface {
  post<T>(url: string, body: any | null): Promise<T>;

  put<T>(url: string, body: any | null): Promise<T>;

  get<T>(url: string): Promise<T>;
}
