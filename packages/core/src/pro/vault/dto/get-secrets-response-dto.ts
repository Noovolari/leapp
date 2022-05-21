import { GetSecretDto } from "./get-secret-dto";

export class GetSecretsResponseDto {
  constructor(public secrets: GetSecretDto[]) {}
}
