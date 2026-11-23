import { describe, expect, test } from "@jest/globals";
import { assertExternalUrl } from "./external-url";
import { LoggedException, LogLevel } from "./log-service";

describe("external URL check", () => {
  test.each(["https://docs.leapp.cloud/", "https://us-east-1.signin.aws.amazon.com/oauth?Action=logout", "mailto:support@example.com"])(
    "%s may be opened",
    (url) => {
      expect(() => assertExternalUrl(url, {})).not.toThrow();
    }
  );

  test.each(["file:///etc/passwd", "javascript:alert(1)", "smb://host/share", "http://plain.example/", "leapp://plugin", "not a url", ""])(
    "%p is refused with a warning shown to the user",
    (url) => {
      let error: unknown;
      try {
        assertExternalUrl(url, {});
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(LoggedException);
      expect((error as LoggedException).message).toBe("Leapp can only open https and mailto links");
      expect((error as LoggedException).level).toBe(LogLevel.warn);
      expect((error as LoggedException).display).toBe(true);
    }
  );
});
