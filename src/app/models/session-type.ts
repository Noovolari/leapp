// TODO: could we refactor it as an enum?
export enum SessionType {
  aws = 'aws',
  awsIamRoleFederated = 'awsIamRoleFederated',
  awsIamUser = 'awsIamUser',
  awsIamRoleChained = 'awsIamRoleChained',
  awsSsoRole = 'awsSsoRole',
  azure = 'azure',
  google = 'google',
  alibaba = 'alibaba'
}
