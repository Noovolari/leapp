import * as fs from "fs";
import * as path from "path";
import { resolveFetch } from "./cli-native-service";

describe("CliNativeService resolveFetch", () => {
  it("returns a callable fetch implementation", () => {
    expect(typeof resolveFetch()).toBe("function");
  });

  it("prefers the WHATWG fetch exposed on the global object (Node.js >= 18) over node-fetch, whose whatwg-url/tr46 chain loads the deprecated core punycode module (DEP0040)", async () => {
    const dataUrl = "data:application/json;base64,eyJwdW55Y29kZSI6dHJ1ZX0=";
    const fakeResponse = { ok: true, json: async () => ({ punycode: true }) };
    const globalFetch = jest.fn(async () => fakeResponse);

    const fetchImpl = resolveFetch({ fetch: globalFetch });
    const response = await fetchImpl(dataUrl, { headers: { "x-test": "1" } });

    expect(globalFetch).toHaveBeenCalledWith(dataUrl, { headers: { "x-test": "1" } });
    expect(response).toBe(fakeResponse);
    expect(response.ok).toBe(true);
    expect(await response.json()).toEqual({ punycode: true });
  });

  it("falls back to node-fetch only when the global object exposes no fetch (Node.js < 18, where the punycode deprecation does not exist)", async () => {
    const fetchImpl = resolveFetch({});

    expect(typeof fetchImpl).toBe("function");
    // node-fetch v2 rejects non-http(s) URLs, proving the fallback is node-fetch
    await expect(fetchImpl("data:application/json;base64,eyJwdW55Y29kZSI6dHJ1ZX0=")).rejects.toThrow("Only HTTP(S) protocols are supported");
  });

  it("never requires the deprecated punycode module from the leapp CLI sources", () => {
    const srcDir = path.join(__dirname, "..");
    const offenders: string[] = [];

    const visit = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "coverage") {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          visit(fullPath);
        } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".spec.ts")) {
          const content = fs.readFileSync(fullPath, "utf8");
          if (/require\(\s*['"]punycode['"]\s*\)/.test(content) || /from\s+['"]punycode['"]/.test(content)) {
            offenders.push(path.relative(srcDir, fullPath));
          }
        }
      }
    };

    visit(srcDir);
    expect(offenders).toEqual([]);
  });
});
