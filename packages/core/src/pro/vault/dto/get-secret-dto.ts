export class GetSecretDto {
  constructor(public secretId: string, public protectedSecretKey: string, public encryptedSecret: string) {}
}
