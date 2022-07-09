#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

if (!process.env.ENVIRONMENT_NAME) {
  throw new Error(`
        Can not deploy infrastructure with missing ENVIRONMENT_NAME.
        It is used to prefix all CloudFormation stack names.
        Try setting it in [root]/.env or providing it as an environment variable before "cdk deploy".
        For example: "ENVIRONMENT_NAME=develop cdk deploy"
    `);
}
const ENVIRONMENT_NAME = process.env.ENVIRONMENT_NAME;

const app = new cdk.App();

class LeappPluginSystemInfrastructure extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    new InfrastructureStack(this, id, {
      env: ENVIRONMENT_NAME,
    });
  }
}

try {
  new LeappPluginSystemInfrastructure(app, "InfrastructureStack", {});
} catch (error) {
  // Capture stack synthesizing errors and stack dependency errors
  console.log(error);
  throw Error("Can not deploy app stacks due to an internal error. See Stack Trace above");
}
