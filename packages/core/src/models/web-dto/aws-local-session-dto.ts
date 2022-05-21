import { LocalSecretDto } from "./local-secret-dto";
import { SecretType } from "./secret-type";

export class AwsLocalSessionDto extends LocalSecretDto {
  constructor(public sessionId: string, public sessionName: string, public region: string, secretType: SecretType, public profileName?: string) {
    super(secretType);
  }
}
