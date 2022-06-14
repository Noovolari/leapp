import { expect, describe, test } from "@jest/globals";
import { AzurePersistenceService } from "./azure-persistence-service";
import * as os from "os";
import * as fs from "fs";

describe("MsalPersistenceService", () => {
  const mockedMsal =
    "{\n" +
    '    "AccessToken": {\n' +
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb-login.microsoftonline.com-accesstoken-04b07795-8ddb-461a-bbee-02f9e1bf7b46-organizations-https://management.core.windows.net//user_impersonation https://management.core.windows.net//.default": {\n' +
    '            "credential_type": "AccessToken",\n' +
    '            "secret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yMGYwM2NjMy04NDFmLTQxMmItOGYyNC0xNjYyMWQyNmE4Y2IvIiwiaWF0IjoxNjU0NTk5MTI3LCJuYmYiOjE2NTQ1OTkxMjcsImV4cCI6MTY1NDYwMzYzNiwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhUQUFBQUFudnRnZC9RWGh2U3BaR0VhV1NYVWM3bytiNmwwTGh5YVYwUSs3cGNOT3dyUHpJZkxHWVNqeHdRR2c1NzBZS3UiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiMDRiMDc3OTUtOGRkYi00NjFhLWJiZWUtMDJmOWUxYmY3YjQ2IiwiYXBwaWRhY3IiOiIwIiwiZmFtaWx5X25hbWUiOiJEb2UiLCJnaXZlbl9uYW1lIjoiSm9obiIsImdyb3VwcyI6WyJlOTExNGY3ZS00OTNlLTQxYjAtOGQwZS1hOTE5OWFiNTEyYjEiXSwiaXBhZGRyIjoiNzkuNDUuMTY0Ljc2IiwibmFtZSI6IkpvaG4gRG9lIiwib2lkIjoiNmNmYzUwOTEtZDlkMi00MGRkLTgzMmItNjBhNzFhMmQyNjQ1IiwicHVpZCI6IjEwMDMyMDAwRTk0MTg5QzMiLCJyaCI6IjAuQVY4QXd6endJQi1FSzBHUEpCWmlIU2FveTBaSWYza0F1dGRQdWtQYXdmajJNQk5mQUxBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6IldwRmlJLTJGNnFKSDNzMU1QdkJiSDItRHVBR3JYSHZIMzFiV2tuUWpIRGMiLCJ0aWQiOiIyMGYwM2NjMy04NDFmLTQxMmItOGYyNC0xNjYyMWQyNmE4Y2IiLCJ1bmlxdWVfbmFtZSI6ImpvaG4uZG9lQG5vb3ZvbGFyaS5uZXQiLCJ1cG4iOiJqb2huLmRvZUBub292b2xhcmkubmV0IiwidXRpIjoicmdpMXRmbTFVRUNsWEIzUzBPTVBBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiOWI4OTVkOTItMmNkMy00NGM3LTlkMDItYTZhYzJkNWVhNWMzIiwiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc190Y2R0IjoxNTk0MTM1NTg5fQ.PMkDL8L-wgetUGJdPHUTL_za6YrGpMce0g-kZWDeks_k5gNtQtGFKt3sx8yS-AylDyJogYv5LTCoPiJX621R34b8WzDhDerJ5CqhtOKhEPRuiIGJXkeVdwAB8WG6ZAOOfLWVGP7_R1adIEAmgUrIMidYJcsVwaWOz0EOKYacjIjI9ihkVv_dUbjuynhMQIjXsINXqA5FUDZDO75vfd9hdfIGsRxKEr_GrxYRJae05CjPa5U4QB8tRsb9JWho12nvLEr2QDKN_Sm_0Akwk-SLRYbuWSXyT79usT_SkNQMYvYwaiDZXjvf8WyG37Ick7f_0vzXECaQ6Nm106Py2aT-qQ",\n' +
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
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb-login.microsoftonline.com-accesstoken-04b07795-8ddb-461a-bbee-02f9e1bf7b46-20f03cc3-841f-412b-8f24-16621d26a8cb-https://management.core.windows.net//user_impersonation https://management.core.windows.net//.default": {\n' +
    '            "credential_type": "AccessToken",\n' +
    '            "secret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9.eyJhdWQiOiJodHRwczovL21hbmFnZW1lbnQuY29yZS53aW5kb3dzLm5ldC8iLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8yMGYwM2NjMy04NDFmLTQxMmItOGYyNC0xNjYyMWQyNmE4Y2IvIiwiaWF0IjoxNjU0NTk5MTI4LCJuYmYiOjE2NTQ1OTkxMjgsImV4cCI6MTY1NDYwMzE1NiwiYWNyIjoiMSIsImFpbyI6IkFUUUF5LzhUQUFBQWo3cHRXZ1Y1UTZaekJ1MTh6Yzl4Z09IcytnTnJONVRFbGw3Z2FmUVQ0Y1IvRTNEV0NQMVNXRFdsbXNWOFMrYUYiLCJhbXIiOlsicHdkIl0sImFwcGlkIjoiMDRiMDc3OTUtOGRkYi00NjFhLWJiZWUtMDJmOWUxYmY3YjQ2IiwiYXBwaWRhY3IiOiIwIiwiZmFtaWx5X25hbWUiOiJEb2UiLCJnaXZlbl9uYW1lIjoiSm9obiIsImdyb3VwcyI6WyJlOTExNGY3ZS00OTNlLTQxYjAtOGQwZS1hOTE5OWFiNTEyYjEiXSwiaXBhZGRyIjoiNzkuNDUuMTY0Ljc2IiwibmFtZSI6IkpvaG4gRG9lIiwib2lkIjoiNmNmYzUwOTEtZDlkMi00MGRkLTgzMmItNjBhNzFhMmQyNjQ1IiwicHVpZCI6IjEwMDMyMDAwRTk0MTg5QzMiLCJyaCI6IjAuQVY4QXd6endJQi1FSzBHUEpCWmlIU2FveTBaSWYza0F1dGRQdWtQYXdmajJNQk5mQUxBLiIsInNjcCI6InVzZXJfaW1wZXJzb25hdGlvbiIsInN1YiI6IldwRmlJLTJGNnFKSDNzMU1QdkJiSDItRHVBR3JYSHZIMzFiV2tuUWpIRGMiLCJ0aWQiOiIyMGYwM2NjMy04NDFmLTQxMmItOGYyNC0xNjYyMWQyNmE4Y2IiLCJ1bmlxdWVfbmFtZSI6ImpvaG4uZG9lQG5vb3ZvbGFyaS5uZXQiLCJ1cG4iOiJqb2huLmRvZUBub292b2xhcmkubmV0IiwidXRpIjoiMWJ0b1h4Vlh5RS1taUJBemhXWVRBQSIsInZlciI6IjEuMCIsIndpZHMiOlsiOWI4OTVkOTItMmNkMy00NGM3LTlkMDItYTZhYzJkNWVhNWMzIiwiYjc5ZmJmNGQtM2VmOS00Njg5LTgxNDMtNzZiMTk0ZTg1NTA5Il0sInhtc190Y2R0IjoxNTk0MTM1NTg5fQ.LZqJh_3rhnsCvqLNyZHOb5TH1x5v302XuwMg27w2nSQv_3Agx_5655Vk-g8K1t5MaLymz9JusFkgZIQ1Oz0vO0QCTHyrXFMNJJ0ISpW4BLmsmyHR6wPRvz5QRJT6P-xLc8mCkYFpKP5dYU_HL4l0WDzwOdM4g1ZIsWN2kvWaTuigZVv2bHrIgbFgvT72k20FwCISj1nOMiiy31kaabmsFQ8FF9hO3Cjl9YY4We8gZOn37nZks8dL7Uv6pNzh7hHIAU3PG3aLMBdUAdutcE7X1CUnMnCJpuID5_hvH_4BsknvUY03qzqlYBTjWtHha4IJfK4QcGmI-feCdMjjAQrXug",\n' +
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
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb-login.microsoftonline.com-idtoken-04b07795-8ddb-461a-bbee-02f9e1bf7b46-organizations-": {\n' +
    '            "credential_type": "IdToken",\n' +
    '            "secret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9.eyJhdWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vMjBmMDNjYzMtODQxZi00MTJiLThmMjQtMTY2MjFkMjZhOGNiL3YyLjAiLCJpYXQiOjE2NTQ1OTkxMjcsIm5iZiI6MTY1NDU5OTEyNywiZXhwIjoxNjU0NjAzMDI3LCJhaW8iOiJBVFFBeS84VEFBQUF6bmxxNWdlMkIzMk53S3RtSDgydnJrYjBrNTJjTXhuSGRwRTB0VzJMM0FZUldjc2p6Z1BsSVdCbGpDZW5NRUNwIiwibmFtZSI6IkpvaG4gRG9lIiwibm9uY2UiOiI1ZGU4ZmE0OTllYTY3MWRjMDE5OGQyZjZjZTlhZTE0OGZhNWE4NTgzZjA5NGExZTkwYTdjNGEyZGY1YzNkZThjIiwib2lkIjoiNmNmYzUwOTEtZDlkMi00MGRkLTgzMmItNjBhNzFhMmQyNjQ1IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiam9obi5kb2VAbm9vdm9sYXJpLm5ldCIsInB1aWQiOiIxMDAzMjAwMEU5NDE4OUMzIiwicmgiOiIwLkFWOEF3enp3SUItRUswR1BKQlppSFNhb3k1VjNzQVRialJwR3UtNEMtZUdfZTBaZkFMQS4iLCJzdWIiOiJsQ255S2xKYUdGeXNmdnFWX2M2QlIxWjQxdkdGNW1XSHFiTGdaNlZfOGlVIiwidGlkIjoiMjBmMDNjYzMtODQxZi00MTJiLThmMjQtMTY2MjFkMjZhOGNiIiwidXRpIjoicmdpMXRmbTFVRUNsWEIzUzBPTVBBQSIsInZlciI6IjIuMCJ9.fHX8Itn0aJAtAOGXOFe0neLv4VgzNPTNw8Tu45pxAp2E-a5i7OQKuIo1QMvkgrPhyh9gTT4IdBtrldDLdvIyyxWXB4dh_QJqujA94zOzk9YO-cvh19NG6HPnZ4IxS2-tS3p7aDn1XXZs8_kJtsNgiVgEvuu2WFjrFfCKTlZMJYTjEy9N9cKuA9wJahCn-tJhpzG_oG1MVJIkDp8eG74l3EfLZSuvdoStmYm3qgcdWTygH9GlTbRf8TJyEiO5uMemy-RxDwRNsNHAH_xKvGYy27PMACcqq2x5G_sp456mNX6JJnAfBvRzpnX_YlJ-ko-j7m_Lyk40hRTMJb1JaNMAiA",\n' +
    '            "home_account_id": "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb",\n' +
    '            "environment": "login.microsoftonline.com",\n' +
    '            "realm": "organizations",\n' +
    '            "client_id": "04b07795-8ddb-461a-bbee-02f9e1bf7b46"\n' +
    "        },\n" +
    '        "6cfc5091-d9d2-40dd-832b-60a71a2d2645.20f03cc3-841f-412b-8f24-16621d26a8cb-login.microsoftonline.com-idtoken-04b07795-8ddb-461a-bbee-02f9e1bf7b46-20f03cc3-841f-412b-8f24-16621d26a8cb-": {\n' +
    '            "credential_type": "IdToken",\n' +
    '            "secret": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImpTMVhvMU9XRGpfNTJ2YndHTmd2UU8yVnpNYyJ9.eyJhdWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vMjBmMDNjYzMtODQxZi00MTJiLThmMjQtMTY2MjFkMjZhOGNiL3YyLjAiLCJpYXQiOjE2NTQ1OTkxMjgsIm5iZiI6MTY1NDU5OTEyOCwiZXhwIjoxNjU0NjAzMDI4LCJhaW8iOiJBVFFBeS84VEFBQUFxYmZ6ekM1WXBtUUJrZjZQWFFCYkJVTjl2Z0djUXIyZ0NzZmxrSWZZVVdUMmRWYWVqS3RSMmptRXVQa3R1WVd3IiwibmFtZSI6IkpvaG4gRG9lIiwibm9uY2UiOiI1ZGU4ZmE0OTllYTY3MWRjMDE5OGQyZjZjZTlhZTE0OGZhNWE4NTgzZjA5NGExZTkwYTdjNGEyZGY1YzNkZThjIiwib2lkIjoiNmNmYzUwOTEtZDlkMi00MGRkLTgzMmItNjBhNzFhMmQyNjQ1IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiam9obi5kb2VAbm9vdm9sYXJpLm5ldCIsInB1aWQiOiIxMDAzMjAwMEU5NDE4OUMzIiwicmgiOiIwLkFWOEF3enp3SUItRUswR1BKQlppSFNhb3k1VjNzQVRialJwR3UtNEMtZUdfZTBaZkFMQS4iLCJzdWIiOiJsQ255S2xKYUdGeXNmdnFWX2M2QlIxWjQxdkdGNW1XSHFiTGdaNlZfOGlVIiwidGlkIjoiMjBmMDNjYzMtODQxZi00MTJiLThmMjQtMTY2MjFkMjZhOGNiIiwidXRpIjoiMWJ0b1h4Vlh5RS1taUJBemhXWVRBQSIsInZlciI6IjIuMCJ9.MKTgo8Wo85zdWmzqpEqZyvSIh9MVHNcrV0mz-MPex2wJvF4EanmuBWHyK42o0nrJjtFsjSjKBLMdrJ-ftqZmUjkqKLNCyLJAIAQNnq0ISmPY3vV8gNBFnGbcw8i2EBuTdg4wOPPa4GtKc9lDu5X6QSY_qjlHN6w6JX347UARyA88bpVgpR40h63uBOvjlh93l7nmA2hkM5_AxUzAlLl-tG6fCuw6L9wZToyh685Ifue6r17QNeI-udBcT3RGauNmCI0vKPTwQdO3-VIqxqQKq4i8Lah5nNToKUwQv03WwDh9JoR7O0lMAzc-LJtwUShTCMb4rtHinG33gyGJwLUjXg",\n' +
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

  test("load", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const iNativeService: any = {
      os,
      fs,
    };
    const service = new AzurePersistenceService(iNativeService);
    const parsedData = await service.loadMsalCache(customTestPath);
    console.log(parsedData);
    expect(parsedData).not.toBeNull();

    fs.unlinkSync(customTestPath);
  });

  test("save", async () => {
    fs.writeFileSync(customTestPath, mockedMsal);

    const iNativeService: any = {
      os,
      fs,
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
