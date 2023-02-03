import { TestBed } from "@angular/core/testing";

import { ConfigurationService } from "./configuration.service";
import { Environment } from "./environment";

describe("ConfigurationService", () => {
  let configService: ConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    configService = TestBed.inject(ConfigurationService);
  });

  it("GetEnvironment - production", () => {
    configService.getLocation = () => ({ hostname: "prod" } as Location);
    expect(configService.environment).toBe(Environment.production);
  });

  it("Environment - local", () => {
    configService.getLocation = () => ({ hostname: "localhost" } as Location);
    expect(configService.environment).toBe(Environment.local);
  });

  it("Environment - 127.0.0.1", () => {
    configService.getLocation = () => ({ hostname: "127.0.0.1" } as Location);
    expect(configService.environment).toBe(Environment.local);
  });

  it("Environment - 0.0.0.0", () => {
    configService.getLocation = () => ({ hostname: "0.0.0.0" } as Location);
    expect(configService.environment).toBe(Environment.local);
  });

  it("Environment - preview", () => {
    configService.getLocation = () => ({ hostname: "preview.leapp.com" } as Location);
    expect(configService.environment).toBe(Environment.preview);
  });

  it("Environment - production", () => {
    configService.getLocation = () => ({ hostname: "other.app.com" } as Location);
    expect(configService.environment).toBe(Environment.production);
  });

  it("ApiEndPoint - local", () => {
    configService.getLocation = () => ({ protocol: "http:", hostname: "localhost" } as Location);
    expect(configService.apiEndpoint).toBe("http://localhost:3000");
  });

  it("ApiEndPoint - 127.0.0.1", () => {
    configService.getLocation = () => ({ protocol: "http:", hostname: "127.0.0.1" } as Location);
    expect(configService.apiEndpoint).toBe("http://127.0.0.1:3000");
  });

  it("ApiEndPoint - 0.0.0.0", () => {
    configService.getLocation = () => ({ protocol: "http:", hostname: "0.0.0.0" } as Location);
    expect(configService.apiEndpoint).toBe("http://0.0.0.0:3000");
  });

  it("ApiEndPoint - preview", () => {
    configService.getLocation = () => ({ protocol: "http:", hostname: "preview.leapp.com" } as Location);
    expect(configService.apiEndpoint).toBe("http://api.preview.leapp.com");
  });

  it("ApiEndPoint - production", () => {
    configService.getLocation = () => ({ protocol: "https:", hostname: "other.app.com" } as Location);
    expect(configService.apiEndpoint).toBe("https://api.leapp.com");
  });

  it("UserLanguage", () => {
    configService.getNavigator = () => ({ language: "venesian fioì!" } as Navigator);
    expect(configService.userLanguage).toBe("venesian fioì!");
  });

  it("GetNavigator", () => {
    const result = configService.getNavigator();
    expect(result).toEqual(window.navigator);
  });
});
