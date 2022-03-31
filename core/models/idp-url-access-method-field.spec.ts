import { createNewIdpUrlFieldChoice } from "../services/cloud-provider-service";
import { IdpUrlAccessMethodField } from "./idp-url-access-method-field";

describe("IdpUrlAccessMethodField", () => {
  test('isIdpUrlToCreate, field is "create new idp url"', () => {
    const idpUrlAccessMethodField = new IdpUrlAccessMethodField(null, null, null);
    expect(idpUrlAccessMethodField.isIdpUrlToCreate(createNewIdpUrlFieldChoice)).toBe(true);
  });

  test('isIdpUrlToCreate, field is not "create new idp url"', () => {
    const idpUrlAccessMethodField = new IdpUrlAccessMethodField(null, null, null);
    expect(idpUrlAccessMethodField.isIdpUrlToCreate("anotherChoice")).toBe(false);
  });
});
