import { CloudProviderType } from "../models/cloud-provider-type";
import { LoggedException, LogLevel } from "./log-service";

interface ResponseHookDetails {
  uploadData: { bytes: any[] }[];
}

const authenticationUrlRegexes = new Map([
  [
    CloudProviderType.aws,
    [
      /^https:\/\/.*\.onelogin\.com\/.*/,
      /^https:\/\/.*\/adfs\/ls\/idpinitiatedsignon.*loginToRp=urn:amazon:webservices.*/,
      /^https:\/\/login\.okta\.com\/.*/,
      /^https:\/\/accounts\.google\.com\/ServiceLogin.*/,
      /^https:\/\/login\.microsoftonline\.com\/*.*\/oauth2\/authorize.*/,
      /^https:\/\/.+\.auth0\.com\/u\/login\/.+/,
      /^https:\/\/.*[/auth]?\/realms\/.*\/protocol\/saml\/clients\/.*/,
      /^https:\/\/console\.jumpcloud\.com\/login.*/,
      /^https:\/\/accounts\.google\.com\/AccountChooser.*/,
    ],
  ],
]);

const samlAssertionRegexes = new Map([
  [CloudProviderType.aws, [/^https:\/\/signin\.aws\.amazon\.com\/saml/, /^https:\/\/signin\.amazonaws-us-gov\.com\/saml/, /^https:\/\/signin\.amazonaws\.cn\/saml/]],
]);

export class AwsSamlAssertionExtractionService {
  isAuthenticationUrl(cloudProvider: CloudProviderType, url: string): boolean {
    return authenticationUrlRegexes.get(cloudProvider).some((regex) => regex.test(url));
  }

  isSamlAssertionUrl(cloudProvider: CloudProviderType, url: string): boolean {
    return samlAssertionRegexes.get(cloudProvider).some((regex) => regex.test(url));
  }

  extractAwsSamlResponse(responseHookDetails: ResponseHookDetails): string {
    try {
      let rawData = responseHookDetails.uploadData[0].bytes.toString();
      const n = rawData.lastIndexOf("SAMLResponse=");
      const n2 = rawData.lastIndexOf("&RelayState=");
      rawData = n2 !== -1 ? rawData.substring(n + 13, n2) : rawData.substring(n + 13);
      return decodeURIComponent(rawData);
    } catch (err) {
      throw new LoggedException(err.message, this, LogLevel.warn);
    }
  }
}
