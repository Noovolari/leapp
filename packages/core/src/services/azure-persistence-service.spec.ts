import { expect, describe, test, jest } from "@jest/globals";
import { AzurePersistenceService, DataProtectionScope } from "./azure-persistence-service";
import * as fs from "fs";
import * as zlib from "node:zlib";
import * as path from "path";
import { constants } from "../models/constants";

describe("MsalPersistenceService", () => {
  const keyChainService = {
    deleteSecret: jest.fn(async () => Promise.resolve(true)),
    getSecret: jest.fn(async () => Promise.resolve("")),
    saveSecret: jest.fn(async () => {}),
  };

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
  const os = { homedir: () => "" };

  test("load normally", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const process = { platform: "win32" };
    const msalEncryptionService = {
      unprotectData: jest.fn(async (data, optionalEntropy, scope) => {
        expect(optionalEntropy).toBe(null);
        expect(scope).toBe(DataProtectionScope.currentUser);
        return data.toString();
      }),
    };
    const iNativeService: any = { os, fs, process, path, msalEncryptionService };
    const service = new AzurePersistenceService(iNativeService, keyChainService as any);

    (service as any).getMsalCacheLocation = () => customTestPath;

    const parsedData = await service.loadMsalCache();

    expect(parsedData).not.toBeNull();
    expect(parsedData.AccessToken["mocked-2"].secret).toBe("LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug");
    expect(msalEncryptionService.unprotectData).toHaveBeenCalled();

    fs.unlinkSync(customTestPath);
  });

  test("load - mimic windows", async () => {
    const compressedFileBuffer = zlib.deflateRawSync(mockedMsal);
    const compressedFile = compressedFileBuffer.toString("utf8");
    const decompressedFile = zlib.inflateRawSync(compressedFileBuffer).toString("utf8");

    const msalEncryptionService = {
      protectData: jest.fn(async () => fs.writeFileSync(customTestPath, compressedFile)),
      unprotectData: jest.fn(async () => decompressedFile),
    };
    await msalEncryptionService.protectData();

    const myfs = {
      readFileSync: jest.fn((p: string) => {
        expect(p).toMatch(/\.azure[/\\]msal_token_cache\.bin/);
        return compressedFile;
      }),
    };
    const iNativeService: any = { os, fs: myfs, process: { platform: "win32" }, path, msalEncryptionService };

    const service = new AzurePersistenceService(iNativeService, keyChainService as any);
    const parsedData = await service.loadMsalCache();

    expect(parsedData).not.toBeNull();
    expect(parsedData.AccessToken["mocked-2"].secret).toBe("LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug");
    expect(msalEncryptionService.unprotectData).toHaveBeenCalledWith(compressedFile, null, DataProtectionScope.currentUser);

    fs.unlinkSync(customTestPath);
  });

  test("load - mimic other system", async () => {
    const msalEncryptionService = {
      protectData: jest.fn(async () => {}),
      unprotectData: jest.fn(async () => {}),
    };
    await msalEncryptionService.protectData();

    const myfs = {
      readFileSync: jest.fn((p: string) => {
        expect(p).toMatch(/\.azure[/\\]msal_token_cache\.json/);
        return mockedMsal;
      }),
    };
    const iNativeService: any = { os, fs: myfs, process: { platform: "macOs" }, path, msalEncryptionService };

    const service = new AzurePersistenceService(iNativeService, keyChainService as any);
    const parsedData = await service.loadMsalCache();

    expect(parsedData).not.toBeNull();
    expect(parsedData.AccessToken["mocked-2"].secret).toBe("LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk---feCdMjjAQrXug");
  });

  test("load - mimic windows - check extension", async () => {
    const msalEncryptionService = {
      protectData: jest.fn(async () => {}),
      unprotectData: jest.fn(async () => "{}"),
    };
    await msalEncryptionService.protectData();
    const mockedFs = {
      readFileSync: jest.fn((p) => {
        expect(p).toMatch(/\.azure[/\\]msal_token_cache\.bin/);
      }),
    };

    const iNativeService: any = { os, fs: mockedFs, process: { platform: "win32" }, path, msalEncryptionService };

    const service = new AzurePersistenceService(iNativeService, keyChainService as any);
    await service.loadMsalCache();

    expect(mockedFs.readFileSync).toHaveBeenCalled();
  });

  test("saveMsalCache", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const process = { platform: "win32" };
    const msalEncryptionService = {
      unprotectData: jest.fn((data) => data.toString()),
      protectData: jest.fn((data, optionalEntropy, scope) => {
        expect(optionalEntropy).toBe(null);
        expect(scope).toBe(DataProtectionScope.currentUser);
        return data;
      }),
    };
    const iNativeService: any = {
      os,
      fs,
      process,
      path,
      msalEncryptionService,
    };
    const service = new AzurePersistenceService(iNativeService, keyChainService as any);
    (service as any).getMsalCacheLocation = () => customTestPath;
    const parsedData = await service.loadMsalCache();
    parsedData["RefreshToken"] = {};
    await service.saveMsalCache(parsedData);
    const newParsedData = await service.loadMsalCache();
    expect(newParsedData).toEqual(parsedData);

    fs.unlinkSync(customTestPath);
  });

  test("saveMsalCache - 2", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const process = { platform: "darwin" };
    const msalEncryptionService = {
      unprotectData: jest.fn((data) => data.toString()),
      protectData: jest.fn((data, optionalEntropy, scope) => {
        expect(optionalEntropy).toBe(null);
        expect(scope).toBe(DataProtectionScope.currentUser);
        return data;
      }),
    };
    const iNativeService: any = {
      os,
      fs,
      process,
      path,
      msalEncryptionService,
    };
    const service = new AzurePersistenceService(iNativeService, keyChainService as any);
    (service as any).getMsalCacheLocation = () => customTestPath;
    const parsedData = await service.loadMsalCache();
    parsedData["RefreshToken"] = {};
    await service.saveMsalCache(parsedData);
    const newParsedData = await service.loadMsalCache();
    expect(newParsedData).toEqual(parsedData);

    fs.unlinkSync(customTestPath);
  });

  test("load profile", async () => {
    const mockedProfile = '{ "profile": "mockedProfile" }';
    const mockedFs = {
      readFileSync: jest.fn(() => mockedProfile),
    };

    const iNativeService: any = {
      os: { homedir: jest.fn(() => "a/") },
      fs: mockedFs,
      path: { join: jest.fn((_s1: string, _s2: string) => path.join(_s1, _s2)) },
    };
    const service = new AzurePersistenceService(iNativeService, null);

    const load = (service as any).getProfileLocation;

    (service as any).getProfileLocation = jest.fn(() => {
      load.apply(service);

      expect(iNativeService.os.homedir).toHaveBeenCalled();
      expect(iNativeService.path.join).toHaveBeenCalledWith("a/", ".azure/azureProfile.json");
      return path.join(iNativeService.os.homedir(), ".azure/azureProfile.json");
    });
    const result = await service.loadProfile();
    expect(result).toStrictEqual(JSON.parse(mockedProfile));
  });

  test("save profile", async () => {
    const mockedProfile = { profile: "mockedProfile" };
    let resultData;
    const mockedFs = {
      writeFileSync: jest.fn((location, data) => {
        expect(location).toMatch(/a[/\\]\.azure[/\\]azureProfile\.json/);
        expect(data).toStrictEqual(JSON.stringify(mockedProfile, null, 4));
        resultData = data;
      }),
    };

    const iNativeService: any = {
      os: { homedir: jest.fn(() => "a/") },
      fs: mockedFs,
      path: {
        join: jest.fn((_s1: string, _s2: string) => {
          expect(_s1).toMatch(/a[/\\]/);
          expect(_s2).toMatch(/\.azure[/\\]azureProfile\.json/);
          return path.join(_s1, _s2);
        }),
      },
    };
    const service = new AzurePersistenceService(iNativeService, null);
    const load = (service as any).getProfileLocation;

    (service as any).getProfileLocation = jest.fn(() => {
      load.apply(service);

      expect(iNativeService.os.homedir).toHaveBeenCalled();
      expect(iNativeService.path.join).toHaveBeenCalled();
      return path.join(iNativeService.os.homedir(), ".azure/azureProfile.json");
    });

    await service.saveProfile(mockedProfile as any);
    expect(JSON.parse(JSON.stringify(mockedProfile))).toStrictEqual(JSON.parse(resultData));
  });

  test("getAzureSecrets", async () => {
    const intId = "fake-integration-id";
    const mockedKeyChain = {
      deleteSecret: jest.fn(async () => Promise.resolve(true)),
      getSecret: jest.fn(async (_, str: string): Promise<string> => {
        let value;
        if (str.indexOf(`azure-integration-profile-${intId}`) > -1) {
          value = JSON.stringify({ p: "profile" });
        }
        if (str.indexOf(`azure-integration-account-${intId}`) > -1) {
          value = JSON.stringify({ a: "account" });
        }
        if (str.indexOf(`azure-integration-refresh-token-${intId}`) > -1) {
          value = JSON.stringify({ r: "rtoken" });
        }
        return value;
      }),
      saveSecret: jest.fn(async () => {}),
    };

    const result = {
      profile: { p: "profile" },
      account: { a: "account" },
      refreshToken: { r: "rtoken" },
    };

    const iNativeService: any = {
      os,
      fs,
      path,
    };

    const service = new AzurePersistenceService(iNativeService, mockedKeyChain as any);

    expect(await service.getAzureSecrets(intId)).toStrictEqual(result);
    expect(mockedKeyChain.getSecret).toHaveBeenNthCalledWith(1, constants.appName, `azure-integration-profile-${intId}`);
    expect(mockedKeyChain.getSecret).toHaveBeenNthCalledWith(2, constants.appName, `azure-integration-account-${intId}`);
    expect(mockedKeyChain.getSecret).toHaveBeenNthCalledWith(3, constants.appName, `azure-integration-refresh-token-${intId}`);
  });

  test("setAzureSecrets", async () => {
    const kcService = {
      saveSecret: jest.fn(async () => {}),
    } as any;

    const secrets = {
      profile: "profile-1",
      account: "account-1",
      refreshToken: "refreshToken-1",
    };
    const service = new AzurePersistenceService(null, kcService);
    await service.setAzureSecrets("fakeIntegrationId", secrets as any);

    expect(kcService.saveSecret).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeIntegrationId", '"profile-1"');
    expect(kcService.saveSecret).toHaveBeenNthCalledWith(2, constants.appName, "azure-integration-account-fakeIntegrationId", '"account-1"');
    expect(kcService.saveSecret).toHaveBeenNthCalledWith(
      3,
      constants.appName,
      "azure-integration-refresh-token-fakeIntegrationId",
      '"refreshToken-1"'
    );
  });

  test("deleteAzureSecrets", async () => {
    const kcService = {
      deleteSecret: jest.fn(),
    } as any;

    const service = new AzurePersistenceService(null, kcService);
    await service.deleteAzureSecrets("fakeIntegrationId");

    expect(kcService.deleteSecret).toHaveBeenNthCalledWith(1, constants.appName, "azure-integration-profile-fakeIntegrationId");
    expect(kcService.deleteSecret).toHaveBeenNthCalledWith(2, constants.appName, "azure-integration-account-fakeIntegrationId");
    expect(kcService.deleteSecret).toHaveBeenNthCalledWith(3, constants.appName, "azure-integration-refresh-token-fakeIntegrationId");
  });

  test("deleteAzureSecrets, deleteSecret throws an exception", async () => {
    const kcService = {
      deleteSecret: jest.fn(async () => {
        throw new Error("Error message");
      }),
    } as any;

    const service = new AzurePersistenceService(null, kcService);
    await service.deleteAzureSecrets("fakeIntegrationId");
  });
});
