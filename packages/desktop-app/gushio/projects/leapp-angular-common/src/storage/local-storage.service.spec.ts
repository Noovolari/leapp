import { TestBed } from "@angular/core/testing";

import { LocalStorageService } from "./local-storage.service";

describe("LocalStorageService", () => {
  let localStorageService: LocalStorageService;

  class LocalStorageExample {
    constructor(public name: string, public surname: string) {}
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    localStorageService = TestBed.inject(LocalStorageService);
    window.localStorage.clear();
  });

  it("SetItem - string", () => {
    localStorageService.setItem("key", "value");

    expect(window.localStorage.getItem("key")).toBe('"value"');
  });

  it("SetItem - class", () => {
    const example = new LocalStorageExample("name", "surname");
    localStorageService.setItem("key", example);

    expect(window.localStorage.getItem("key")).toBe('{"name":"name","surname":"surname"}');
  });

  it("SetItem - overwrite", () => {
    const example = new LocalStorageExample("name", "surname");
    window.localStorage.setItem("key", JSON.stringify(example));

    const newExample = new LocalStorageExample("name2", "surname2");
    localStorageService.setItem("key", newExample);

    expect(window.localStorage.getItem("key")).toBe('{"name":"name2","surname":"surname2"}');
  });

  it("GetItem - string", () => {
    window.localStorage.setItem("key", '"value"');

    expect(localStorageService.getItem<string>("key")).toBe("value");
  });

  it("GetItem - class", () => {
    const example = { name: "name", surname: "surname" };
    window.localStorage.setItem("key", JSON.stringify(example));

    expect(localStorageService.getItem<LocalStorageExample>("key")).toEqual(example);
  });

  it("GetItem - key not present", () => {
    expect(localStorageService.getItem<LocalStorageExample>("key")).toBeUndefined();
  });

  it("RemoveItem - key not present", () => {
    window.localStorage.setItem("key", '"Sammy the salmon"');

    expect(() => localStorageService.removeItem("anotherKey")).not.toThrowError();
    expect(localStorageService.getItem<string>("key")).toBe("Sammy the salmon");
  });

  it("RemoveItem - key present", () => {
    window.localStorage.setItem("key", '"Sammy the salmon"');

    expect(() => localStorageService.removeItem("key")).not.toThrowError();
    expect(localStorageService.getItem<string>("key")).toBeUndefined();
  });
});
