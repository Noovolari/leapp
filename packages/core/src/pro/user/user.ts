import { Permission } from "./permission";

export class User {
  constructor(
    public userId: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public symmetricKey: string,
    public privateRSAKey: string,
    public publicRSAKey: string,
    public permissions: Permission[],
    public accessToken: string
  ) {}
}
