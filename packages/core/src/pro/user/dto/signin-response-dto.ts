import { Permission } from "../permission";

export class SigninResponseDto {
  constructor(
    public userId: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public protectedSymmetricKey: string,
    public rsaProtectedPrivateKey: string,
    public rsaPublicKey: string,
    public permissions: Permission[],
    public accessToken: string
  ) {}
}
