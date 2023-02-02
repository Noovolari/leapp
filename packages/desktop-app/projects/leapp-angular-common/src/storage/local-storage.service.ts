import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class LocalStorageService {
  constructor() {}

  public getLocalStorage = (): Storage => window.localStorage;

  setItem<T>(key: string, value: T): void {
    this.getLocalStorage().setItem(key, JSON.stringify(value));
  }

  getItem<T>(key: string): T | undefined {
    const jsonValue = this.getLocalStorage().getItem(key);
    return jsonValue !== null ? (JSON.parse(jsonValue) as T) : undefined;
  }

  removeItem(key: string): void {
    this.getLocalStorage().removeItem(key);
  }
}
