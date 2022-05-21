import { SecretType } from "./secret-type";

export class LocalSecretDto {
  constructor(public secretType: SecretType) {}
}
