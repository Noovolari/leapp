import {AssignPublicIp, ECSClient, LaunchType, RunTaskCommand} from "@aws-sdk/client-ecs";
import {environment} from "./environments/environment";

export async function handler(event: any) {
  console.debug(event);
  await new ECSClient(environment.REGION).send(new RunTaskCommand({
    taskDefinition: "leapp-signer-container:1",
    cluster: "arn:aws:ecs:eu-west-1:198460698501:cluster/leapp-signer",
    launchType: LaunchType.FARGATE,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ["subnet-08fd390c4e280ca51", "subnet-072e29a82513974fc", "subnet-0b31fbabb2ec7bdc6"],
        securityGroups: ["sg-0c86131a8b0267bb8"],
        assignPublicIp: AssignPublicIp.ENABLED
      }
    }
  }))
}
