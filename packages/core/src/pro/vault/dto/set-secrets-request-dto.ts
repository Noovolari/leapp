import { CreateSecretDto } from "./create-secret-dto";

export class SetSecretsRequestDto {
  constructor(public secrets: CreateSecretDto[]) {}
}
