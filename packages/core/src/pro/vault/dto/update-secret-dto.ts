export class UpdateSecretDto {
  constructor(public secretId: string, public protectedSecretKey: string, public encryptedSecret: string) {}
}
