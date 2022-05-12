export class HttpClientMock {
  public called?: boolean;
  public methodCalled?: string;
  public urlCalled?: string;
  public sentBody?: any;
  public errorToThrow?: Error;
  public returnValue?: any;

  constructor() {}

  async post<T>(url: string, body: any | null): Promise<T> {
    this.called = true;
    this.methodCalled = "POST";
    this.urlCalled = url;
    this.sentBody = body;

    if (this.errorToThrow) {
      throw this.errorToThrow;
    }

    return this.returnValue;
  }

  async put<T>(url: string, body: any | null): Promise<T> {
    this.called = true;
    this.methodCalled = "PUT";
    this.urlCalled = url;
    this.sentBody = body;

    if (this.errorToThrow) {
      throw this.errorToThrow;
    }

    return this.returnValue;
  }

  async get<T>(url: string): Promise<T> {
    this.called = true;
    this.methodCalled = "GET";
    this.urlCalled = url;

    if (this.errorToThrow) {
      throw this.errorToThrow;
    }

    return this.returnValue;
  }

  setReturnValue<T>(returnValue: T) {
    this.returnValue = returnValue;
  }

  setThrowError(error: Error) {
    this.errorToThrow = error;
  }

  async awaitNetworkCall() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.called) {
          clearInterval(interval);
          resolve(true);
        }
      }, 100);
    });
  }
}
