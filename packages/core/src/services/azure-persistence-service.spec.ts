import { expect, describe, test } from "@jest/globals";
import { AzurePersistenceService, DataProtectionScope } from "./azure-persistence-service";
import * as os from "os";
import * as fs from "fs";
import * as zlib from "zlib";
import * as process from "process";
import * as path from "path";

describe("MsalPersistenceService", () => {
  const mockedMsal =
    "{\n" +
    '    "AccessToken": {\n' +
    '        "mocked-1": {\n' +
    '            "credential_type": "AccessToken",\n' +
    '            "secret": ".PMkDL8L-wgetUGJdPHUTL_za6YrGpMce0g-kZWDeks_k5gNtQtGFKt3sx8yS-SLRYbuWSXyT79usT_SkNQMYvYwaiDZXjvf8WyG37Ick7f_0vzXECaQ6Nm106Py2aT-qQ",\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",\n' +
    '            "target": "https://management.core.windows.net//user_impersonation https://management.core.windows.net//.default",\n' +
    '            "realm": "organizations",\n' +
    '            "token_type": "Bearer",\n' +
    '            "cached_at": "1654599427",\n' +
    '            "expires_on": "1654603635",\n' +
    '            "extended_expires_on": "1654603635"\n' +
    "        },\n" +
    '        "mocked-2": {\n' +
    '            "credential_type": "AccessToken",\n' +
    '            "secret": "LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug",\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",\n' +
    '            "target": "https://management.core.windows.net//user_impersonation https://management.core.windows.net//.default",\n' +
    '            "realm": "20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "token_type": "Bearer",\n' +
    '            "cached_at": "1654599428",\n' +
    '            "expires_on": "1654603155",\n' +
    '            "extended_expires_on": "1654603155"\n' +
    "        }\n" +
    "    },\n" +
    '    "Account": {\n' +
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb-login.microsoftonline.com-organizations": {\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "realm": "organizations",\n' +
    '            "local_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645",\n' +
    '            "username": "john.doe@noovolari.net",\n' +
    '            "authority_type": "MSSTS"\n' +
    "        }\n" +
    "    },\n" +
    '    "IdToken": {\n' +
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645": {\n' +
    '            "credential_type": "IdToken",\n' +
    '            "secret": "..fHX8Itn0aJAtAOGXOFe0neL--ko-j7m_Lyk40hRTMJb1JaNMAiA",\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "realm": "organizations",\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46"\n' +
    "        },\n" +
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645": {\n' +
    '            "credential_type": "IdToken",\n' +
    '            "secret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9---LJtwUShTCMb4rtHinG33gyGJwLUjXg",\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "realm": "20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46"\n' +
    "        }\n" +
    "    },\n" +
    '    "RefreshToken": {},\n' +
    '    "AppMetadata": {\n' +
    '        "appmetadata-login.microsoftonline.com-04b07795-8ddb-461a-bbee-02f9e1bf7b46": {\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "family_id": "1"\n' +
    "        }\n" +
    "    }\n" +
    "}";

  const customTestPath = "test.file";

  test("load normally", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const iNativeService: any = { os, fs, process, path };
    const service = new AzurePersistenceService(iNativeService);
    const parsedData = await service.loadMsalCache(customTestPath);

    expect(parsedData).not.toBeNull();
    expect(parsedData.AccessToken["mocked-2"].secret).toBe("LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug");

    fs.unlinkSync(customTestPath);
  });

  test("load - mimic windows", async () => {
    const compressedFileBuffer = zlib.deflateRawSync(mockedMsal);
    const compressedFile = compressedFileBuffer.toString("utf8");
    const decompressedFile = zlib.inflateRawSync(compressedFileBuffer).toString("utf8");

    const msalEncryptionService = {
      protectData: jest.fn(() => fs.writeFileSync(customTestPath, compressedFile)),
      unprotectData: jest.fn(() => decompressedFile),
    };
    msalEncryptionService.protectData();
    // Test data is "fakely

    const iNativeService: any = { os, fs, process: { platform: "win32" }, path, msalEncryptionService };
    const service = new AzurePersistenceService(iNativeService);
    const parsedData = await service.loadMsalCache(customTestPath);

    expect(parsedData).not.toBeNull();
    expect(parsedData.AccessToken["mocked-2"].secret).toBe("LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug");
    expect(msalEncryptionService.unprotectData).toHaveBeenCalledWith(fs.readFileSync(customTestPath), null, DataProtectionScope.currentUser);

    fs.unlinkSync(customTestPath);
  });

  test("load - mimic windows - check extension", async () => {
    const msalEncryptionService = {
      protectData: jest.fn(() => {}),
      unprotectData: jest.fn(() => "{}"),
    };
    msalEncryptionService.protectData();
    const mockedFs = {
      readFileSync: jest.fn(() => {}),
    };

    const iNativeService: any = { os, fs: mockedFs, process: { platform: "win32" }, path, msalEncryptionService };
    const service = new AzurePersistenceService(iNativeService);
    await service.loadMsalCache();

    expect(mockedFs.readFileSync).toHaveBeenCalledWith(path.join(os.homedir(), `.azure/msal_token_cache.bin`));
  });

  test("save", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const iNativeService: any = {
      os,
      fs,
      process,
      path,
    };
    const service = new AzurePersistenceService(iNativeService);
    const parsedData = await service.loadMsalCache(customTestPath);
    parsedData["RefreshToken"] = {};
    await service.saveMsalCache(parsedData);
    const newParsedData = await service.loadMsalCache();
    expect(newParsedData).toEqual(parsedData);

    fs.unlinkSync(customTestPath);
  });
});
