import { CloudProviderType } from "../models/cloud-provider-type";
import { LeappParseError } from "../errors/leapp-parse-error";

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
      /^https:\/\/login\.microsoftonline\.com\/.*\/oauth2\/authorize.*/,
    ],
  ],
]);
const samlAssertionRegexes = new Map([[CloudProviderType.aws, [/^https:\/\/signin\.aws\.amazon\.com\/saml/]]]);

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
      throw new LeappParseError(this, err.message);
    }
  }
}
