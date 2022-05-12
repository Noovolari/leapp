import { UserProvider } from "./user.provider";
import { EncryptionProvider } from "../encryption/encryption.provider";
import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import * as crypto from "crypto";
import { SignupRequestDto } from "./dto/signup-request-dto";
import { SigninResponseDto } from "./dto/signin-response-dto";
import { SigninRequestDto } from "./dto/signin-request-dto";
import { User } from "./user";
import { UserActivationRequestDto } from "./dto/user-activation-request-dto";
import { HttpClientMock } from "../test/http-client-mock";
import { Permission } from "./permission";

describe("UserProvider", () => {
  let encryptionProvider: EncryptionProvider;
  let httpClientMock: HttpClientMock;
  let userProvider: UserProvider;
  let email: string;
  let password: string;

  beforeEach(() => {
    httpClientMock = new HttpClientMock();
    encryptionProvider = new EncryptionProvider((crypto as any).webcrypto);
    userProvider = new UserProvider("http://endpoint", httpClientMock, encryptionProvider);
    email = "giulia@rossi.it";
    password = "trustn01";
  });

  test("Signup", async () => {
    const firstName = "Giulia";
    const lastName = "Rossi";

    const hashSpy = jest.spyOn(encryptionProvider, "hash");
    const symmetricKeySpy = jest.spyOn(encryptionProvider, "generateSymmetricKey");
    const aesKeySpy = jest.spyOn(encryptionProvider, "aesEncrypt");
    const rsaKeySpy = jest.spyOn(encryptionProvider, "generateRsaKeys");

    await userProvider.signUp(firstName, lastName, email, password);
    const firstHashCallArgs = hashSpy.mock.calls[0];
    expect(firstHashCallArgs).toEqual([password, email]);
    const expectedMasterKey = "da711a57125f63bd5c308e5f53392834ca99d11711462e4d5bc7f3addcc76452";
    expect(await hashSpy.mock.results[0].value).toEqual(expectedMasterKey);

    const secondHashCallArgs = hashSpy.mock.calls[1];
    expect(secondHashCallArgs).toEqual([expectedMasterKey, password]);
    const expectedClientMasterHash = "c760354fe3d74c970551861e8ceb56c24d4a00bde8581489101b3f31df6fd040";
    expect(await hashSpy.mock.results[1].value).toEqual(expectedClientMasterHash);

    const symmetricKey = (await symmetricKeySpy.mock.results[0].value) as any;
    expect(symmetricKey.length).toBe(64);

    const firstAesEncryptCallArgs = aesKeySpy.mock.calls[0];
    const protectedSymmetricKey = (await aesKeySpy.mock.results[0].value) as any;
    expect(firstAesEncryptCallArgs).toEqual([symmetricKey, expectedMasterKey]);

    const expectedRsaKeys = (await rsaKeySpy.mock.results[0].value) as any;

    const secondAesEncryptCallArgs = aesKeySpy.mock.calls[1];
    expect(secondAesEncryptCallArgs).toEqual([expectedRsaKeys.privateKey, symmetricKey]);
    const expectedProtectedRsaPrivateKey = (await aesKeySpy.mock.results[1].value) as any;

    const expectedBody = new SignupRequestDto(
      firstName,
      lastName,
      email,
      expectedClientMasterHash,
      protectedSymmetricKey,
      expectedRsaKeys.publicKey,
      expectedProtectedRsaPrivateKey
    );
    expect(httpClientMock.called).toBe(true);
    expect(httpClientMock.methodCalled).toBe("POST");
    expect(httpClientMock.urlCalled).toBe("http://endpoint/user");
    expect(httpClientMock.sentBody).toEqual(expectedBody);
  });

  test("Signin", async () => {
    const hashSpy = jest.spyOn(encryptionProvider, "hash");
    const aesKeySpy = jest.spyOn(encryptionProvider, "aesDecrypt");

    const expectedProtectedSymmetricKey =
      '{"salt":"4b4009f00c438e12ade6a9f1c74ac878","iv":"534d156654c10dc6dcd5060f","cypherText":"dc6e2672a2c81c5ac71fc1962c671efb41c7f952011f0671412ff1eb6dc8c21100dee6cd3cba70f5a629cea56d40037b1fbc702fb1951c8f18af2b20513660e4fc6cc8af5e036bc59d7e99e13e763c0d"}';
    const expectedProtectedPrivateRSAKey =
      '{"salt":"9d6e2375bc91d26f92e8502fab04edcb","iv":"646e109fca5139853047992c","cypherText":"011df9e58e183a4ed0f440bc6b5a1a28f6344fa6573d85d6b2ab68af441b381ec3d3d7947190329048be5390eae67d5dc972be94603766a25ad474b15fc4e0799042128c32e58107881a2fc9426fa3068dfcea85fed601e2e7023ee0c8260f2eb431758b3150a1c919871237ab4b9e1d1b2574784ce673e656488ef53f5bfa3c75a0e0b9c6ff423396ccfeaf0a629ba2bfb800a474884887400c2972935ecaf5de87e0216ac0b364dbf5b82b9c28ba8f20cd4f07a5b6257c5089b9bae0f11186223b5d8d053d65f971746fddd76a1ce42cb43988ff5d5e07f9908d86fdb81fc8eb1881255bd77453ce6986a7f5fc0585e31731e938a60ff72caff8b147c45e71e0b16b610703604dbcccf8fa8c550742a580d3f56abe3473d52b52ef9c0621b319ac44bafb121ad979d114ce5b85254d90b7158b6d966dfb4d892d42c359f47edb1b8b2336b9a6dff6bafa92bc1c0bb516626bb3352c74185dc6b46132f3102693b4ca3b1e8dd424032e98928e290bfe9dc761d1c85225e152f640d030c5d9186377fad1815a25b7e167d961f8c494ccc308f2d536aa73714bf1979d0662d0c8aeecd912f6b6ead3e32bd97ad77f9e5abe6f466f13b9c5763dc8813875a7fbcfffda8ac9e7b535ecd6afe3b47ce49b732e9074c38d3d6a0913f7d6708d79e053313b530646cfe8ba1c22518a5dc6ddb8d53634568744adba81959b428905ab22ea567765d51d888f30a14bdfe52a4805bbb0e2d5b7173711d05337dc73b35cd1d48c01a6bd5196d5e189c567445711a73cebc975145ac20f865119196cc1f8d0169b0be6c3a12818a5f0b1ce76383297e02ba0cd963836658d463ac9acc9e38162a2b3e835f7351957208defef337cc5a7da8f91bdb7bafef177773cfd7e7bca008dd3fd7ca35135a6247732dd972d4f70c58a170f32aeffae5a8ed17a1475829e12d99a5711d4b17e7ad971d4926f1d13150f49bdc1c7c4098c412f40247415bbafefae66c9970d66dda725cf8c768bf20e746eacc3bef540fbea45462e09c02fc354399571f9b992a6bd2e136a202e952dd21199bccd41ac0320a4363918e2a65902161923ccaa8538bf203746e23152682de24c3c8afd2e93a848f101a08a27e9750f2a2dce90f47b51c3d6cfc89d09b35b64a3f1f4912c3162f8326dd7e28f144d7dc02e14b48e4f2ea44a6f007ff4093f39f982fce60adad44a15245102a0c9c234e6b0b5c463e61eef26d23f1368ec75b0fe743171f70cfbc70b2e6024a79931ed73af36cef0b636969242e3b6a99262a182a27483039f10fbbac5667619346bd057b3ab804ae65028629d595630e48681e31a3aa4da4b0ece406c9a7b706f53e7666999f3374579d481fcaa017bf9c3fc80c6f7ba263d162c78c083a5ba8e10c168c883fe9c2a1adbef62b296bea9169399e602c9521ecca4161da80c98a612d1df0a00051d1bfae2ea181eb0edc378d537f28a1dd8f0deb9cfc53156c058ec62b4ba6434a4e0cdcb14cda703808fb58a75e793866bf7d47581b9dbefe9cbd2110c149cf73f39ab6d71254438a02072be227ee8ab5bfab3aeb72fc0a7ade3748fa02687f5992759708ddd27b1d937ffe05e961291d4bb9bd25d3cb6753efa6070f5e4db5fc97d6f2a30734bf02e5db9b535790581a41c50e6126bf03a5fd435663140196200ef9a0ad355b87ecb0468b5697aaccddcb41dc0d8d7ee62b3d23066d6c374f92fd0cde4edaa311c4d6f6954f263d2bb91400b755298810b73fb4d36e17ce3434b17b92478b78a1c0723f3f04733e17385e811765f9b894a1985a033eaee99b48585a1919e928db2007b4cdf0bf53728d3db5a224920c4e9ac8670e5e2f328a6e5c81c2229ebad43bb9a0ac65075d6cf5fd027785564f6a269d641aecb99f59e7d6ce20f9eb0103b7feb6bbdf1b3fa40b367085080d78c7c50c9e02bc33cf6e5f1054322a8880379969afd42e3c2816ee5610b3aac95a26813bb4d5d056e00a042149e0958e98e31868b6a074e8b1e7ea6865f99b348bca137630a23e860fcbb03a0e274fb6ab36a2da21ae1a7cf4c75dae418c440c1a256842be986d327fab296145de0a0b12716092e1c3bd65d38015d1f08eecc312bcc5a5a4396b05f9064a4a839508990440db11cebc661557ee843fe74868e57b8307dc47c60c66a55296c1a5e5d4aff5f24756e48c9372e9f5d3ac937180092ed29d759b2ca362a19d65cf04c351842324e173cf54c65e49a9a6c4bdaf82d8079881f2ceab2e7d6e132cd4fecefa36459e220996b8f7ddd7708366ba152c3e607e10155c72d4192512f8c71c10d6677173cac246241f4438d837791077141be765809968d9c0f88684ad5376c844199aa2d16abf63a83461fc61bfea126a1a86fd610bd7dad890afb346e2091eb877063ff684f26c9fcc2dcfdd31165434b12102fdcd07fae24a4a44caca2a65c8a7e5f17ad8ef6d532f6cccb7239488b42f128302c34909fd1071c6a87a22bb4fc50fefc2b46fbd189e9965b7b5f7526cd8f3357130881b2594a5756224fc52536b149063d3c30bec2ea14be37d8cd357b43f0279ec593b9f4288c25cffdc300425a6fe1d4aa8cc7019a9615ca717d3da99995d85d2da6ac12a9e0983622b69e655b3e180ceddf583c9dc9ccef2f72e2796f614d4e0d468aa9022acbb4a4118211fc490c7ddfa85c2d79cfe5b3c1944cf6edea939797950ea4c2680464f9f54bd31e4606ac22f1dd609e25c6f1fa058669353b278a9e1564f44aa89148e7c20d60f040127ae1ec74e5b7be576ce9f0e715597a29d461feae35d97b06bd1db9423b1f60e06648d87e8362a1c4d40b1bd6e629e185d903881e06d131f2068c487a1c3516747290fd742e3e9fffa5757c6ba3174369f7a119998afc5695fea7dd0e747c58f44cb9de089540b83457ab6cd5ac3f1d1707598eb72bd787d735cd5ead98f4615c29e70d73ede75f8d479bc1b38615f55874ef13c1ee875d6e4cb9877e1386e03f21866aa2e262531fe858047f7d26b3cf3fa3bc077707d265bce9865e0b22912aad5564df6fabd437c0e66bca70b3db75202608bf35e2494ba842da9882552f20465ea530f922ee7334a659180d5c81fd1fc35e6b666985c71e3660374747b58793cc7ef4215b069f540aecda7d04dc281d86a52dd2f459b3cc320ed234b999bfc7c4ca02193429d4d3811e31bbddbd14137ae0b9a525ff63770703c3209593459836251eabe296a14d142db97a5729200b1eb7d3d983b8fd77f374305e020bbeb76c6d368e62a10466020c539e3ae7334c64ab5377c57750c64020531aae14398a08339cf391755cba4d9304be43bdc9d467021a517433bff65e165df7f0e2947759ccdc118d890a2654ec7929ff84c2af8be90078c2e7c2ef5fa7872e044b9b3de29f4a5ffead3ea8fb41ba30b163c5f4d1bcc6a51da1f7109a5293f7b67ba5aea4d61cbdbed4b144a3c9bccc63acab83e4fc9e9f2f24ec18fe0aa4c885cf104798e87983b314d6f72de408285c1b9c54dca7055cf57dd5e8306f6f6f19b77c0a33af1e4a299f26925f00ed609e304a1eeb88c40fc80cda358a614326c989e695366b85242bcc8ede67d1b291ac4c96956c5732634391a46eef4faac0e70ad19714d39e10a4112544825a13af52c91e2893e7f236e2b766f5fed799a9fe61c40c09052b6803326387f70ef760e1dcb8fac6c6c2c0ade157e29674ff4fb1c8f40b29be658a8b953dc7a0c9e1f94ad0ee366602020011595380474f969701fe9e22f1e113357985f467f4d8971a81812046a28dcdcbe29a233693a048f4edb312a9a18165d909ab475e45e885dad03ee84329b89a62f94001a5d004bc7b412325b9b25413e484961fd793c105fd92e1de1021fd1e3b7cc33b79338097e1a93f1ce31eae7c7a5c03fa596d4e5c08538100e0d8be05c0d8ae870bc3f4f78a39b42eabe78728827e6734c0a3dbd30d7a746f8f9a031329b043e1d6b5c36c4470f89890d73263ac84ba26b8fde6edaadef6772bb3c068dc32893232312f2d60e91ccffde03465a98f555da1070baa7491a8d93025fc2018582709d789290f92468e7c35414a56b90211bf3ade6d61cf46deed2ef1139777fc216faa3fbae966b3f66a67197677d1fbf1230452af853b0da100930b8536d74bae13f368f1a38319424956a29f822325521e3401c6ff86ba1d6bce5ab4bc30f94d2cc878d62d6145d49db3e2d62d465b7d675341db135ecd6cf29ecfe684b0c8d854f413004f38a44b556209ee16b1dcd727c9989eda964a4d5d61129e9b5660a856d2a6e44faecbedba96ec9a81720a6677ac861bdb7c45d323008d279ef1405e0bba1c197ff38c2aca5496dd4316e5478c07f46be4a9126ad395cf130f43c0857e0cdbf93d08ca7bca491ab52ac2e58aae18b9a319fc33a9c550d22934d0da3cef3b97b071d57f17d19dde6ebf083b336e5fdac7007516c6f3"}';
    const expectedPrivateRSAKey =
      '{"d":"OIPhMuZduRjYNrFY6BD7AzAj4c5LkEiys31uiH2gZYltKJLJq7oZ8K-0OD7KyxKRh1Ht1Tl0W84LZrlcchfYYVgQ1v6-ZFhcz8OCwDqAeeZZVZ3d56nVHD5roEyPIg4dPhkO6pvQmweg8PcOMQX1QV7c-i7SqFBA9K5W7Dkem3SVGwKjPGM9xJC-1CQCkg9D9DY5A5ol_zTxwk75l33dnQRWeH8O5xScquLX9rF4ovrnFRrzPe7WpBexsAigleC7WlMxYjs1xMBQGlddc4JlSE8cpbFo5J_AV95S_P62RV41G6Y3caTBXYi1O5RhG8fEjqQ8Uu6kWRdwzkzjgPdt-5sv03SgQIOZp1OgEfC6cCMAmbyTL2UUzB_I5-zDTCcDgJdtRSPk2vzS26k9BOTgd8MCY9bMHAvGSHWXdZ9-qw92xHfqNwJmSm5mOLU9aC_8oPMw7Tz8LOQky--e2FSxELCR6Y618_CR31xuxfg4QypJNiulkvfjRR9bMNRuV4t2OXxa5NId_0eJNMriT6RAlG1PhRtimilh2L1GbhQF7oe1neXnT38ZnI6uXVTt-9PoMDNn95xoMUHoU47vtX3M6ARCdLZQExRNtdyB5W1OkPvl3Y8wdO9BsVPbSMGROvllWe_9rVQ0tjcP8Nuw6Mj2j8Ds0DYxlITVx8CClwrvD3c","dp":"Yc-O51UnnBQUeHKL2ZLt71z6IAvIE-MkE7WKKx2QdueCAvoVRaoRv3ani6Zn449fv25y7mpp0wbv802GFdWwcDdhNF3W88HuLiHenLHA28HvJHEoglX09zHFl4-f09nFhMT9-MdD5rKat54cb_yPVYPAXW_gjFvbb2lSTx-Jz3xXlG6tPQuUQ4ToN5wKwl6NLAlcusHOskCr_CRNxOEng0qgZ4SjLdO7sATcmCRqGkA8m0VntyfyoIpUjTcjkpoq522RnJk3mRpy7CZVNDL7sii7tb4FMcqUEHvsF9LrH_ZUu9tRrx8HK8aUkWwCjTURm6NAPJuO2geh-KGGmPmUZQ","dq":"pVaWdCGhKRMmzvPWdL_efcZETQx5TMZJAmXIeC1DtR7sMM0gVIYKsvokKXx6SVXiIcwNVamhWZVeXzxk5Qx-p_n92XO9blL3kqzDIlbBBbNIP81JIH97928ykFMeGL74rnsIF--Owmis2SnvdJQr08zXrt8AD1LRauuXKwKfXeMzCV7DVwW6d9-zL4V6PsyBc-Lt-RYGrTHtbm0F75figoQpYB--bYFks0HqsEtVFd7h-PUBDzx1UcuKvxnUTvg5zjXqeWC9aQN2W1SHU-4MkyXw3M5-uownfuosy5cRxCyse_tEJTigwZzymy6Eyoj0SBgNQ0v3d1DYJsc0CzJCow","e":"AQAB","kty":"RSA","n":"yuwH3X3BD2aiwlhI5W1ZyVSxniy_F1lc9NvOvc8bCVFEL1I6T6XBYyXqo3P79XGixWalyITteA6E7iKeBHM9bV6yEXvirIm35ZSdONBQ9e8sNv8opXDaUlZE1UYj9LaEh5o-0MBcxr6JIqn2gX_TOKS_hL3GxykXZo0pLf9Erw37-A7Xp_RqyYoNIFHHS8U0lMjj2v0yQFHsHYxGPwJEPw7Pi_JUrHp-tpARTQqAsKiPHbajOhLYIbGi9xdapY-ov5FOjj2dKXQUbiYMVzVQnw3vBsShoUuFDB7P3K39YNwQ_zK13ctuwZg8e1zWVu2cPhZ_ErsFBj7RlDzshgpgz7E5tZFPY3IOw-Z8zmQYQIUSQSzg52DWotGccPWHSq9FNrH6lY6ZXZuCjgd1nwEUsEx0-nFIWZ_16HcWSlS8o1YYI8guHvAAk273CmafBbe5UhqoqaDkZQRHp6srO6y1n06lUexgQIEnkp4U61S3jUK0Ba_opb1rO2HW4Kv_l7J3i5txOzTDtaqupOt_miGcv0FIGyFU2PDPYCAXIwDeVZuqGdSKk0PwUj1Krk8Xbx9Wip3UNbdFIEjUAlHoN3Nuj40GkqfPsY6yX4RGvsi7FJHhPr1Vg0_Q4u74nCqla3xpc0819ZTfwVsrdZktITcIuD9kTi0OVScYI79uCqnfKuU","p":"7Klzd2jEma0sXqfb-PTmQdjPTBoC6Gu-z_u-57Uacwq5_SCvakixxqcg-CLQhBXiAkoB-VvjeG_H_lAMISc-pJDO-5YtCpzflRYkZKRHlIHtWLalvAyLebPxWBRVZc5zLfnwcNxzSZyyw_Qq2nzKILseAokGoxjHkYBsNB0LH98Zsje0C82Ub097zIyVURYXzdslmUTDV3UCopquLmCPGRqrPc2OHYQM0FBEUvRvD1osmxjipjpGb6-_zUzFgy7CwFIy8cr_n_5MivwjQjfWdmkxTYlbNDnl1Gj9yTXhvrlA6fDkcaZsMCSZVtNofK3RizBopPGIxsRcoEC3Oqgr_w","q":"24DM1bhZNfiKyNdi7wdC7pr5gknT5UJx_8ajdUbf4s6PQ12wPVnEtczFBO9gzbFehWGb5AMAr4Y8Wy6IjRqmCxc6AD8twVNkrn7dq42IzNfTKy4ktvsnVEK99KGFX9sVhg7lkpuPBUq1dnmclFBMysVHH2IYaq192rK51_bNX4LMIPh9R2Y3QirR6MKqZf_YgatTFS8qBwEJBSGUkAKqg18noGuGyCRlOzsdBBd9HXiYq8AZk_HluCjYvb5Fdqu6haivHMsCgOTWoEoGwR5DGdK07ZzgA4qU_CUrtdy7mYpA1kdJFjxdASUAk4h_NEmnYQtzxV1ayP7Ep_9vDql5Gw","qi":"aK1oiSmCdzo_-kL70Zhb-gvz7HV_BFywZrmRjFBgtMuoqmUCKcdzzL79UdbBPkZgzoVBHlieqNs1CdU0oXOuyzrwh0bXsUf_cHkVCwTfJv4ebV8RXfVXnP9T_3k_cqdjyVlIzh3tK9R_XTSpUeokJ6NK104u5_bH7LT5sCh4mNZF5WZ9iEv_GSIyfQ0AW4axsP4hVgb_FvbZnLt8nK6d8ZmeIS2poCgU85qgk__-EjTtbj84Apw0g9JTUf1VSjkp892db9cUn1MiktxVN5jrTAk0TCdXni_OLb-HWeGRRQK0DGKoRY6kh_kJydwXIOYmCcvw0L6c2kSHJz5RbDkYHA"}';
    const expectedPublicRSAKey =
      '{"e":"AQAB","kty":"RSA","n":"yuwH3X3BD2aiwlhI5W1ZyVSxniy_F1lc9NvOvc8bCVFEL1I6T6XBYyXqo3P79XGixWalyITteA6E7iKeBHM9bV6yEXvirIm35ZSdONBQ9e8sNv8opXDaUlZE1UYj9LaEh5o-0MBcxr6JIqn2gX_TOKS_hL3GxykXZo0pLf9Erw37-A7Xp_RqyYoNIFHHS8U0lMjj2v0yQFHsHYxGPwJEPw7Pi_JUrHp-tpARTQqAsKiPHbajOhLYIbGi9xdapY-ov5FOjj2dKXQUbiYMVzVQnw3vBsShoUuFDB7P3K39YNwQ_zK13ctuwZg8e1zWVu2cPhZ_ErsFBj7RlDzshgpgz7E5tZFPY3IOw-Z8zmQYQIUSQSzg52DWotGccPWHSq9FNrH6lY6ZXZuCjgd1nwEUsEx0-nFIWZ_16HcWSlS8o1YYI8guHvAAk273CmafBbe5UhqoqaDkZQRHp6srO6y1n06lUexgQIEnkp4U61S3jUK0Ba_opb1rO2HW4Kv_l7J3i5txOzTDtaqupOt_miGcv0FIGyFU2PDPYCAXIwDeVZuqGdSKk0PwUj1Krk8Xbx9Wip3UNbdFIEjUAlHoN3Nuj40GkqfPsY6yX4RGvsi7FJHhPr1Vg0_Q4u74nCqla3xpc0819ZTfwVsrdZktITcIuD9kTi0OVScYI79uCqnfKuU"}';

    const responseDto = new SigninResponseDto(
      "userId",
      "firstName",
      "lastName",
      email,
      expectedProtectedSymmetricKey,
      expectedProtectedPrivateRSAKey,
      expectedPublicRSAKey,
      [Permission.user],
      "accessToken"
    );
    httpClientMock.setReturnValue(responseDto);

    const user = await userProvider.signIn(email, password);

    const firstHashCallArgs = hashSpy.mock.calls[0];
    expect(firstHashCallArgs).toEqual([password, email]);
    const expectedMasterKey = "da711a57125f63bd5c308e5f53392834ca99d11711462e4d5bc7f3addcc76452";
    expect(await hashSpy.mock.results[0].value).toEqual(expectedMasterKey);

    const secondHashCallArgs = hashSpy.mock.calls[1];
    expect(secondHashCallArgs).toEqual([expectedMasterKey, password]);
    const expectedClientMasterHash = "c760354fe3d74c970551861e8ceb56c24d4a00bde8581489101b3f31df6fd040";
    expect(await hashSpy.mock.results[1].value).toEqual(expectedClientMasterHash);

    const firstAesDecryptCallArgs = aesKeySpy.mock.calls[0];
    const symmetricKey = await aesKeySpy.mock.results[0].value;
    expect(firstAesDecryptCallArgs).toEqual([expectedProtectedSymmetricKey, expectedMasterKey]);

    const secondAesDecryptCallArgs = aesKeySpy.mock.calls[1];
    expect(secondAesDecryptCallArgs).toEqual([expectedProtectedPrivateRSAKey, symmetricKey]);

    const expectedBody = new SigninRequestDto(email, expectedClientMasterHash);
    expect(httpClientMock.called).toBe(true);
    expect(httpClientMock.methodCalled).toBe("POST");
    expect(httpClientMock.urlCalled).toBe("http://endpoint/user/signin");
    expect(httpClientMock.sentBody).toEqual(expectedBody);

    const expectedUser = new User(
      "userId",
      "firstName",
      "lastName",
      email,
      "5897ef9e41b25c2b12a24761cf1464c17473e74cff05ce5f2c8613cba0fab1a8",
      expectedPrivateRSAKey,
      expectedPublicRSAKey,
      [Permission.user],
      "accessToken"
    );
    expect(user).toEqual(expectedUser);
  });

  test("ActivateAccount", async () => {
    const userId = "userId";
    const activationCode = "activationCode";
    await userProvider.activateAccount(userId, activationCode);

    const expectedBody = new UserActivationRequestDto(userId, activationCode);
    expect(httpClientMock.called).toBe(true);
    expect(httpClientMock.methodCalled).toBe("PUT");
    expect(httpClientMock.urlCalled).toBe("http://endpoint/user/activation");
    expect(httpClientMock.sentBody).toEqual(expectedBody);
  });
});
