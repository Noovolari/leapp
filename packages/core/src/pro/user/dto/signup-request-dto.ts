export class SignupRequestDto {
  constructor(
    public firstName: string,
    public lastName: string,
    public email: string,
    public clientMasterHash: string,
    public protectedSymmetricKey: string,
    public rsaPublicKey: string,
    public rsaProtectedPrivateKey: string
  ) {}
}
