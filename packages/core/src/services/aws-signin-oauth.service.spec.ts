import { describe, expect, test } from "@jest/globals";
import * as crypto from "crypto";
import { AwsSigninOauthService } from "./aws-signin-oauth.service";

const nativeService: any = { crypto };

describe("AwsSigninOauthService", () => {
  const service = new AwsSigninOauthService(nativeService);

  test("generatePkcePair returns a verifier/challenge pair compliant with RFC 7636 S256", () => {
    const { codeVerifier, codeChallenge } = service.generatePkcePair();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier.length).toBeLessThanOrEqual(128);
    expect(codeVerifier).toMatch(/^[A-Za-z0-9\-._~]+$/);

    const expectedChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest()
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    expect(codeChallenge).toEqual(expectedChallenge);
  });

  test("generateDpopKeyPair returns an EC P-256 private key in PKCS#8 PEM", () => {
    const privateKeyPem = service.generateDpopKeyPair();

    const privateKey = crypto.createPrivateKey(privateKeyPem);
    expect(privateKey.asymmetricKeyType).toEqual("ec");
    expect(privateKey.asymmetricKeyDetails).toEqual({ namedCurve: "prime256v1" });
  });

  test("buildAuthorizeUrl includes all required OAuth2 authorization parameters", () => {
    const authorizeUrl = service.buildAuthorizeUrl("eu-west-1", "challenge-123", "http://127.0.0.1:5555/oauth/callback", "state-42");
    const url = new URL(authorizeUrl);

    expect(`${url.protocol}//${url.host}${url.pathname}`).toEqual("https://eu-west-1.oauth.signin.aws/v1/authorize");
    expect(url.searchParams.get("client_id")).toEqual("arn:aws:signin:::devtools/same-device");
    expect(url.searchParams.get("code_challenge")).toEqual("challenge-123");
    expect(url.searchParams.get("code_challenge_method")).toEqual("SHA-256");
    expect(url.searchParams.get("redirect_uri")).toEqual("http://127.0.0.1:5555/oauth/callback");
    expect(url.searchParams.get("response_type")).toEqual("code");
    expect(url.searchParams.get("scope")).toEqual("openid");
    expect(url.searchParams.get("state")).toEqual("state-42");
  });

  test("ecdsaDerSignatureToRaw strips the DER sign byte from 33-byte values", () => {
    // DER INTEGERs are prefixed with 0x00 when the value's high bit is set,
    // so a P-256 r or s can be encoded in 33 bytes.
    const r = Buffer.concat([Buffer.from([0x00]), crypto.randomBytes(32)]);
    const s = crypto.randomBytes(32);
    const body = Buffer.concat([Buffer.from([0x02, r.length]), r, Buffer.from([0x02, s.length]), s]);
    const der = Buffer.concat([Buffer.from([0x30, body.length]), body]);

    const raw = (service as any).ecdsaDerSignatureToRaw(der) as Buffer;

    expect(raw.length).toEqual(64);
    expect(raw.subarray(0, 32).equals(r.subarray(1))).toBe(true);
    expect(raw.subarray(32).equals(s)).toBe(true);
  });
});
