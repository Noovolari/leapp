// TODO: could we refactor it as an enum?
export enum SessionType {
  awsIamRoleFederated = 'awsIamRoleFederated',
  awsIamUser = 'awsIamUser',
  awsIamRoleChained = 'awsIamRoleChained',
  awsSsoRole = 'awsSsoRole',
  azure = 'azure'
}
