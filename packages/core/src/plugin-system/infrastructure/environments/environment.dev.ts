export const environment = {
  production: false,
  name: "dev",
  privateSubnetIds: [
    "subnet-0effa5262519e2005",
    "subnet-023a47cf8214d6756",
    "subnet-065d79422735f8eda",
  ],
  vpcId: "vpc-016d28bcc7f5b6e06",
  ...process.env,
};
