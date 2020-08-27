export interface AwsAccount extends Account {
  accountId: number;
  accountName: string;
  accountNumber: string;
  awsRoles: { name: string, roleArn: string, parent?: string, parentRole?: string }[];
  idpArn?: string;
  idpUrl?: string;
  type: string;
  parent?: string;
  parentRole?: string;
  region?: string;
}
