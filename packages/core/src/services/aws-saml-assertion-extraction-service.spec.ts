import { describe, test, expect, jest } from "@jest/globals";
import { AwsSamlAssertionExtractionService } from "./aws-saml-assertion-extraction-service";
import { CloudProviderType } from "../models/cloud-provider-type";
import { LoggedException, LogLevel } from "./log-service";

describe("AwsSamlAssertionExtractionService", () => {
  test("isAuthenticationUrl", () => {
    const service = new AwsSamlAssertionExtractionService();

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX.onelogin.com/XX")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "http://XX.onelogin.com/XX")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX/adfs/ls/idpinitiatedsignonXXloginToRp=urn:amazon:webservicesXXX")).toBe(
      true
    );
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX/adfs/ls/idpinitiatedsignonXX")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://login.okta.com/XX")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX.okta.com")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://accounts.google.com/ServiceLoginXX")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://accounts.google.com/AccountChooser?continue=testtest")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://accounts.google.com")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://login.microsoftonline.com/XX/oauth2/authorizeXXXX")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://login.microsoftonline.com")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://signin.aws.amazon.com/saml")).toBe(false);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://tenant-name.us.auth0.com/u/login/subdomain")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://tenant-name.us.auth0.com")).toBe(false);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://tenant-name.us.auth0.com/samlp/")).toBe(false);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://.auth0.com/samlp/")).toBe(false);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://auth0.com/samlp/")).toBe(false);

    /* Tests for keycloak Identity Providers */
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX/auth/realms/XX/protocol/saml/clients/XX")).toBe(true);
    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://XX/realms/XX/protocol/saml/clients/XX")).toBe(true);

    expect(service.isAuthenticationUrl(CloudProviderType.aws, "https://console.jumpcloud.com/login.mocked-suffix")).toBe(true);
  });

  test("isSamlAssertionUrl", () => {
    const service = new AwsSamlAssertionExtractionService();

    expect(service.isSamlAssertionUrl(CloudProviderType.aws, "https://signin.aws.amazon.com/saml")).toBe(true);
    expect(service.isSamlAssertionUrl(CloudProviderType.aws, "https://signin.aws.amazon.com/saml?XX")).toBe(true);
    expect(service.isSamlAssertionUrl(CloudProviderType.aws, "http://signin.aws.amazon.com/saml")).toBe(false);
    expect(service.isSamlAssertionUrl(CloudProviderType.aws, "https://signin.amazonaws.cn/saml")).toBe(true);
  });

  test("extractAwsSamlResponse", () => {
    const responseHookDetails = {
      uploadData: [{ bytes: "SAMLResponse=ABCDEFGHIJKLMNOPQRSTUVWXYZ&RelayState=abcdefghijklmnopqrstuvwxyz" }],
    };

    const service = new AwsSamlAssertionExtractionService();
    const awsSamlResponse = service.extractAwsSamlResponse(responseHookDetails as any);
    expect(awsSamlResponse).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  test("extractAwsSamlResponse - 2", () => {
    const responseHookDetails = {
      uploadData: [{ bytes: "SAMLResponse=ABCDEFGHIJKLMNOPQRSTUVWXYZ" }],
    };

    const service = new AwsSamlAssertionExtractionService();
    const awsSamlResponse = service.extractAwsSamlResponse(responseHookDetails as any);
    expect(awsSamlResponse).toBe("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  });

  test("extractAwsSamlResponse - error", () => {
    const responseHookDetails = {
      uploadData: [
        {
          bytes: {
            toString: jest.fn(() => {
              throw new Error("");
            }),
          },
        },
      ],
    };

    const service = new AwsSamlAssertionExtractionService();

    expect(() => service.extractAwsSamlResponse(responseHookDetails as any)).toThrow(new LoggedException("", this, LogLevel.warn));
  });
});
