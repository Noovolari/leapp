export class CreateSecretDto {
  constructor(public protectedSecretKey: string, public encryptedSecret: string) {}
}
