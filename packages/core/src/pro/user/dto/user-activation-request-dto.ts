export class UserActivationRequestDto {
  constructor(public userId: string, public activationCode: string) {}
}
