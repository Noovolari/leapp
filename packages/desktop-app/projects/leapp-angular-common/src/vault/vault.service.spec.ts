import { TestBed } from "@angular/core/testing";
import { User } from "leapp-team-core/user/user";
import { EncryptionProvider } from "leapp-team-core/encryption/encryption.provider";
import { VaultProvider } from "leapp-team-core/vault/vault-provider";
import { LocalStorageService } from "../storage/local-storage.service";
import { HttpClientService } from "../http/http-client.service";
import { ConfigurationService } from "../configuration/configuration.service";
import { VaultService } from "./vault.service";
import { of } from "rxjs";
import { AwsIamUserLocalSessionDto } from "leapp-team-core/encryptable-dto/aws-iam-user-local-session-dto";
import { SnackbarErrorService } from "../errors/snackbar-error.service";
import { VaultSharedUser } from "leapp-team-core/vault/vault-shared-user";
import { LocalSecretDto } from "leapp-team-core/encryptable-dto/local-secret-dto";
import { SecretType } from "leapp-team-core/encryptable-dto/secret-type";

describe("VaultService", () => {
  let localStorageService: LocalStorageService;
  let vaultService: VaultService;
  let vaultProvider: VaultProvider;
  let encryptionProvider: EncryptionProvider;
  let privateRSAKey: string;
  let publicRSAKey: string;
  let rsaKeys: CryptoKeyPair;
  let user: User;

  beforeEach(async () => {
    TestBed.configureTestingModule({})
      .overrideProvider(HttpClientService, { useValue: null })
      .overrideProvider(ConfigurationService, { useValue: { apiEndpoint: null } })
      .overrideProvider(SnackbarErrorService, { useValue: { showMessage: () => {} } as any });
    vaultService = TestBed.inject(VaultService);
    localStorageService = TestBed.inject(LocalStorageService);
    vaultProvider = vaultService.vaultProvider;
    encryptionProvider = vaultService.encryptionProvider;

    privateRSAKey =
      '{"d":"OIPhMuZduRjYNrFY6BD7AzAj4c5LkEiys31uiH2gZYltKJLJq7oZ8K-0OD7KyxKRh1Ht1Tl0W84LZrlcchfYYVgQ1v6-ZFhcz8OCwDqAeeZZVZ3d56nVHD5roEyPIg4dPhkO6pvQmweg8PcOMQX1QV7c-i7SqFBA9K5W7Dkem3SVGwKjPGM9xJC-1CQCkg9D9DY5A5ol_zTxwk75l33dnQRWeH8O5xScquLX9rF4ovrnFRrzPe7WpBexsAigleC7WlMxYjs1xMBQGlddc4JlSE8cpbFo5J_AV95S_P62RV41G6Y3caTBXYi1O5RhG8fEjqQ8Uu6kWRdwzkzjgPdt-5sv03SgQIOZp1OgEfC6cCMAmbyTL2UUzB_I5-zDTCcDgJdtRSPk2vzS26k9BOTgd8MCY9bMHAvGSHWXdZ9-qw92xHfqNwJmSm5mOLU9aC_8oPMw7Tz8LOQky--e2FSxELCR6Y618_CR31xuxfg4QypJNiulkvfjRR9bMNRuV4t2OXxa5NId_0eJNMriT6RAlG1PhRtimilh2L1GbhQF7oe1neXnT38ZnI6uXVTt-9PoMDNn95xoMUHoU47vtX3M6ARCdLZQExRNtdyB5W1OkPvl3Y8wdO9BsVPbSMGROvllWe_9rVQ0tjcP8Nuw6Mj2j8Ds0DYxlITVx8CClwrvD3c","dp":"Yc-O51UnnBQUeHKL2ZLt71z6IAvIE-MkE7WKKx2QdueCAvoVRaoRv3ani6Zn449fv25y7mpp0wbv802GFdWwcDdhNF3W88HuLiHenLHA28HvJHEoglX09zHFl4-f09nFhMT9-MdD5rKat54cb_yPVYPAXW_gjFvbb2lSTx-Jz3xXlG6tPQuUQ4ToN5wKwl6NLAlcusHOskCr_CRNxOEng0qgZ4SjLdO7sATcmCRqGkA8m0VntyfyoIpUjTcjkpoq522RnJk3mRpy7CZVNDL7sii7tb4FMcqUEHvsF9LrH_ZUu9tRrx8HK8aUkWwCjTURm6NAPJuO2geh-KGGmPmUZQ","dq":"pVaWdCGhKRMmzvPWdL_efcZETQx5TMZJAmXIeC1DtR7sMM0gVIYKsvokKXx6SVXiIcwNVamhWZVeXzxk5Qx-p_n92XO9blL3kqzDIlbBBbNIP81JIH97928ykFMeGL74rnsIF--Owmis2SnvdJQr08zXrt8AD1LRauuXKwKfXeMzCV7DVwW6d9-zL4V6PsyBc-Lt-RYGrTHtbm0F75figoQpYB--bYFks0HqsEtVFd7h-PUBDzx1UcuKvxnUTvg5zjXqeWC9aQN2W1SHU-4MkyXw3M5-uownfuosy5cRxCyse_tEJTigwZzymy6Eyoj0SBgNQ0v3d1DYJsc0CzJCow","e":"AQAB","kty":"RSA","n":"yuwH3X3BD2aiwlhI5W1ZyVSxniy_F1lc9NvOvc8bCVFEL1I6T6XBYyXqo3P79XGixWalyITteA6E7iKeBHM9bV6yEXvirIm35ZSdONBQ9e8sNv8opXDaUlZE1UYj9LaEh5o-0MBcxr6JIqn2gX_TOKS_hL3GxykXZo0pLf9Erw37-A7Xp_RqyYoNIFHHS8U0lMjj2v0yQFHsHYxGPwJEPw7Pi_JUrHp-tpARTQqAsKiPHbajOhLYIbGi9xdapY-ov5FOjj2dKXQUbiYMVzVQnw3vBsShoUuFDB7P3K39YNwQ_zK13ctuwZg8e1zWVu2cPhZ_ErsFBj7RlDzshgpgz7E5tZFPY3IOw-Z8zmQYQIUSQSzg52DWotGccPWHSq9FNrH6lY6ZXZuCjgd1nwEUsEx0-nFIWZ_16HcWSlS8o1YYI8guHvAAk273CmafBbe5UhqoqaDkZQRHp6srO6y1n06lUexgQIEnkp4U61S3jUK0Ba_opb1rO2HW4Kv_l7J3i5txOzTDtaqupOt_miGcv0FIGyFU2PDPYCAXIwDeVZuqGdSKk0PwUj1Krk8Xbx9Wip3UNbdFIEjUAlHoN3Nuj40GkqfPsY6yX4RGvsi7FJHhPr1Vg0_Q4u74nCqla3xpc0819ZTfwVsrdZktITcIuD9kTi0OVScYI79uCqnfKuU","p":"7Klzd2jEma0sXqfb-PTmQdjPTBoC6Gu-z_u-57Uacwq5_SCvakixxqcg-CLQhBXiAkoB-VvjeG_H_lAMISc-pJDO-5YtCpzflRYkZKRHlIHtWLalvAyLebPxWBRVZc5zLfnwcNxzSZyyw_Qq2nzKILseAokGoxjHkYBsNB0LH98Zsje0C82Ub097zIyVURYXzdslmUTDV3UCopquLmCPGRqrPc2OHYQM0FBEUvRvD1osmxjipjpGb6-_zUzFgy7CwFIy8cr_n_5MivwjQjfWdmkxTYlbNDnl1Gj9yTXhvrlA6fDkcaZsMCSZVtNofK3RizBopPGIxsRcoEC3Oqgr_w","q":"24DM1bhZNfiKyNdi7wdC7pr5gknT5UJx_8ajdUbf4s6PQ12wPVnEtczFBO9gzbFehWGb5AMAr4Y8Wy6IjRqmCxc6AD8twVNkrn7dq42IzNfTKy4ktvsnVEK99KGFX9sVhg7lkpuPBUq1dnmclFBMysVHH2IYaq192rK51_bNX4LMIPh9R2Y3QirR6MKqZf_YgatTFS8qBwEJBSGUkAKqg18noGuGyCRlOzsdBBd9HXiYq8AZk_HluCjYvb5Fdqu6haivHMsCgOTWoEoGwR5DGdK07ZzgA4qU_CUrtdy7mYpA1kdJFjxdASUAk4h_NEmnYQtzxV1ayP7Ep_9vDql5Gw","qi":"aK1oiSmCdzo_-kL70Zhb-gvz7HV_BFywZrmRjFBgtMuoqmUCKcdzzL79UdbBPkZgzoVBHlieqNs1CdU0oXOuyzrwh0bXsUf_cHkVCwTfJv4ebV8RXfVXnP9T_3k_cqdjyVlIzh3tK9R_XTSpUeokJ6NK104u5_bH7LT5sCh4mNZF5WZ9iEv_GSIyfQ0AW4axsP4hVgb_FvbZnLt8nK6d8ZmeIS2poCgU85qgk__-EjTtbj84Apw0g9JTUf1VSjkp892db9cUn1MiktxVN5jrTAk0TCdXni_OLb-HWeGRRQK0DGKoRY6kh_kJydwXIOYmCcvw0L6c2kSHJz5RbDkYHA"}';
    publicRSAKey =
      '{"e":"AQAB","kty":"RSA","n":"yuwH3X3BD2aiwlhI5W1ZyVSxniy_F1lc9NvOvc8bCVFEL1I6T6XBYyXqo3P79XGixWalyITteA6E7iKeBHM9bV6yEXvirIm35ZSdONBQ9e8sNv8opXDaUlZE1UYj9LaEh5o-0MBcxr6JIqn2gX_TOKS_hL3GxykXZo0pLf9Erw37-A7Xp_RqyYoNIFHHS8U0lMjj2v0yQFHsHYxGPwJEPw7Pi_JUrHp-tpARTQqAsKiPHbajOhLYIbGi9xdapY-ov5FOjj2dKXQUbiYMVzVQnw3vBsShoUuFDB7P3K39YNwQ_zK13ctuwZg8e1zWVu2cPhZ_ErsFBj7RlDzshgpgz7E5tZFPY3IOw-Z8zmQYQIUSQSzg52DWotGccPWHSq9FNrH6lY6ZXZuCjgd1nwEUsEx0-nFIWZ_16HcWSlS8o1YYI8guHvAAk273CmafBbe5UhqoqaDkZQRHp6srO6y1n06lUexgQIEnkp4U61S3jUK0Ba_opb1rO2HW4Kv_l7J3i5txOzTDtaqupOt_miGcv0FIGyFU2PDPYCAXIwDeVZuqGdSKk0PwUj1Krk8Xbx9Wip3UNbdFIEjUAlHoN3Nuj40GkqfPsY6yX4RGvsi7FJHhPr1Vg0_Q4u74nCqla3xpc0819ZTfwVsrdZktITcIuD9kTi0OVScYI79uCqnfKuU"}';
    rsaKeys = await encryptionProvider.importRsaKeys({ privateKey: privateRSAKey, publicKey: publicRSAKey });
    user = new User(
      "userId",
      "firstName",
      "lastName",
      "email@email.it",
      "mockedRole",
      "mockedTeamName",
      "symmetricKey",
      privateRSAKey,
      publicRSAKey,
      "accessToken"
    );
  });

  it("deleteSecret", async () => {
    const removeSecretSpy = spyOn(vaultProvider, "deleteSecret").and.returnValue(Promise.resolve());
    vaultService.deleteSecret("1", SecretType.awsIamUserSession);
    expect(removeSecretSpy).toHaveBeenCalledWith(new LocalSecretDto(SecretType.awsIamUserSession, "1"));
  });

  it("getSecrets", async () => {
    const secret = new AwsIamUserLocalSessionDto("1", "a", "b", "c", "d");
    const fakeSessions: AwsIamUserLocalSessionDto[] = [secret];

    const localStorageSpy = spyOn(localStorageService, "getItem").and.returnValue(user);
    const getSessionSpy = spyOn(vaultProvider, "getSecrets").and.returnValue(of(fakeSessions).toPromise());

    const actualSessions = await vaultService.getSecrets();
    expect(localStorageSpy).toHaveBeenCalledWith("user");
    expect(getSessionSpy).toHaveBeenCalledOnceWith(rsaKeys.privateKey as any);
    expect(actualSessions).toEqual(fakeSessions);
    expect([...vaultService.secretsState.value]).toEqual([secret]);
  });

  it("createSecret", async () => {
    const secret = new AwsIamUserLocalSessionDto("1", "a", "b", "c", "d");
    const fakeSession: AwsIamUserLocalSessionDto = secret;
    const fakeUserId = "fake-user-id";

    const localStorageSpy = spyOn(localStorageService, "getItem").and.returnValue(user);
    const createSecretSpy = spyOn(vaultProvider, "createSecret").and.resolveTo({ secretId: "fake-secret-id" });

    await vaultService.createSecret(fakeUserId, fakeSession);
    expect(localStorageSpy).toHaveBeenCalledWith("user");
    expect(createSecretSpy).toHaveBeenCalledOnceWith(fakeUserId, rsaKeys.privateKey as any, fakeSession);
    expect(secret.secretId).toEqual("fake-secret-id");
    expect([...vaultService.secretsState.value]).toEqual([secret]);
  });

  it("updateSecret", async () => {
    const secret = new AwsIamUserLocalSessionDto("1", "a", "b", "c", "d");
    secret.secretId = "fake-secret-id";
    const fakeSession: AwsIamUserLocalSessionDto = secret;
    const vaultSharedUsers: VaultSharedUser[] = [
      { userId: "user-id-1", userPublicRsaKey: "mocked-rsa-1" as any },
      { userId: "user-id-2", userPublicRsaKey: "mocked-rsa-2" as any },
    ];

    spyOn(vaultService as any, "getRSAKeys").and.returnValue({ publicKey: "fake-rsa-key" });
    const spy = spyOn(vaultService.vaultProvider, "updateSecret").and.callFake(() => Promise.resolve());

    await vaultService.updateSecret(vaultSharedUsers, fakeSession);

    expect(spy).toHaveBeenCalledOnceWith(vaultSharedUsers, fakeSession);
    expect(vaultService.secretsState.value).toEqual([secret]);
  });

  it("updateSecret - it should return immediately if getRSAKey method crash with a specific error message", async () => {
    spyOn(vaultService as any, "getRSAKeys").and.throwError("fake-rsa-error");
    spyOn((vaultService as any).snackbarErrorService, "showMessage").and.callThrough();

    await vaultService.updateSecret(null as any, null as any);

    expect((vaultService as any).snackbarErrorService.showMessage).toHaveBeenCalledWith("Invalid user RSA Keys");
  });

  it("updateSecret - it should return immediately if getRSAKey method returns an invalid RSA public key, aka user public key not found", async () => {
    spyOn(vaultService as any, "getRSAKeys").and.returnValue({ publicKey: undefined });
    spyOn((vaultService as any).snackbarErrorService, "showMessage").and.callThrough();

    await vaultService.updateSecret(null as any, null as any);

    expect((vaultService as any).snackbarErrorService.showMessage).toHaveBeenCalledWith("User public RSA key not found");
  });

  it("createSecret - it should return immediately if getRSAKey method crash with a specific error message", async () => {
    spyOn(vaultService as any, "getRSAKeys").and.throwError("fake-rsa-error");
    spyOn((vaultService as any).snackbarErrorService, "showMessage").and.callThrough();

    await vaultService.createSecret(null as any, null as any);

    expect((vaultService as any).snackbarErrorService.showMessage).toHaveBeenCalledWith("Invalid user RSA Keys");
  });

  it("createSecret - it should return immediately if getRSAKey method returns an invalid RSA public key, aka user public key not found", async () => {
    spyOn(vaultService as any, "getRSAKeys").and.returnValue({ publicKey: undefined });
    spyOn((vaultService as any).snackbarErrorService, "showMessage").and.callThrough();

    await vaultService.createSecret(null as any, null as any);

    expect((vaultService as any).snackbarErrorService.showMessage).toHaveBeenCalledWith("User public RSA key not found");
  });
});
