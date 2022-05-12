export class SigninRequestDto {
  constructor(public email: string, public clientMasterHash: string) {}
}
