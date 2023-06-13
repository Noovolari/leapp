import { describe, jest, test, beforeEach, expect } from "@jest/globals";
import axios from "axios";
import { HttpClientProvider } from "./http-client.provider";
jest.mock("axios");

describe("HttpClientProvider", () => {
  let httpClientProvider: HttpClientProvider;
  const mockedUrl = "mocked-url";
  const mockedHeaders = "mocked-headers";
  const mockedData = "mocked-data";
  const mockedBody = {};

  beforeEach(() => {
    httpClientProvider = new HttpClientProvider();
  });

  test("HttpClientProvider.get", async () => {
    jest.spyOn(axios, "get").mockImplementation(async () => ({ data: mockedData }));
    (httpClientProvider as any).getHttpHeaders = jest.fn(() => mockedHeaders);

    const result = await httpClientProvider.get(mockedUrl);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith(mockedUrl, mockedHeaders);
    expect(result).toBe(mockedData);
  });

  test("HttpClientProvider.put", async () => {
    jest.spyOn(axios, "put").mockImplementation(async () => ({ data: mockedData }));
    (httpClientProvider as any).getHttpHeaders = jest.fn(() => mockedHeaders);

    const result = await httpClientProvider.put(mockedUrl, mockedBody);

    expect(axios.put).toHaveBeenCalledTimes(1);
    expect(axios.put).toHaveBeenCalledWith(mockedUrl, mockedBody, mockedHeaders);
    expect(result).toBe(mockedData);
  });

  test("HttpClientProvider.post", async () => {
    jest.spyOn(axios, "post").mockImplementation(async () => ({ data: mockedData }));
    (httpClientProvider as any).getHttpHeaders = jest.fn(() => mockedHeaders);

    const result = await httpClientProvider.post(mockedUrl, mockedBody);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(mockedUrl, mockedBody, mockedHeaders);
    expect(result).toBe(mockedData);
  });

  test("HttpClientProvider.delete", async () => {
    jest.spyOn(axios, "delete").mockImplementation(async () => ({ data: mockedData }));
    (httpClientProvider as any).getHttpHeaders = jest.fn(() => mockedHeaders);

    const result = await httpClientProvider.delete(mockedUrl);

    expect(axios.delete).toHaveBeenCalledTimes(1);
    expect(axios.delete).toHaveBeenCalledWith(mockedUrl, mockedHeaders);
    expect(result).toBe(mockedData);
  });

  test("HttpClientProvider.getHttpHeaders", () => {
    httpClientProvider.accessToken = "mocked-access-token";
    const result = (httpClientProvider as any).getHttpHeaders();
    expect(result).toEqual({ headers: { ["Authorization"]: "Bearer mocked-access-token" } });
  });
});
