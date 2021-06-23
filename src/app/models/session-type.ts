// TODO: could we refactor it as an enum?
export enum SessionType {
  awsIamRoleFederated = 'awsFederated',
  awsIamUser = 'awsPlain',
  awsIamRoleChained = 'awsTruster',
  awsSsoRole = 'awsSso',
  azure = 'azure'
}
