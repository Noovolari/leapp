import {Aspects, AssetHashType, AssetOptions, Duration, Fn, IAspect, NestedStack, NestedStackProps} from "aws-cdk-lib";
import { Construct, IConstruct } from "constructs";
import { LambdaRestApi, Method, RestApi, IResource } from "aws-cdk-lib/aws-apigateway";
import { CfnPermission, LayerVersion } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as fs from "fs";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import crypto from "crypto";
import {AuroraCapacityUnit, Credentials, DatabaseClusterEngine, DatabaseSecret, ParameterGroup, ServerlessCluster} from "aws-cdk-lib/aws-rds";
import {HostedRotation} from "aws-cdk-lib/aws-secretsmanager";
import {IVpc, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import {environment} from "../environments/environment";

class PermissionAspect implements IAspect {
  visit(construct: IConstruct) {
    if (construct instanceof Method) {
      this.removePermissionsFromMethod(construct);
    }
  }

  private removePermissionsFromMethod(construct: Method) {
    const permissions = construct.node.children.filter((c) => c instanceof CfnPermission);
    permissions.forEach((p) => construct.node.tryRemoveChild(p.node.id));
  }
}

interface InfrastructureStackProps extends NestedStackProps {
  env: string;
}

export class InfrastructureStack extends NestedStack {
  private readonly envName: string;
  private lambdaFunction: lambda.Function;
  private restApi: RestApi;
  private databaseSecret: DatabaseSecret;
  private readonly vpc: IVpc;
  private databaseSecurityGroup: SecurityGroup;
  private database: ServerlessCluster;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    this.envName = props.env;

    this.vpc = Vpc.fromVpcAttributes(this, "VPC", {
      vpcId: environment.vpcId,
      availabilityZones: Fn.getAzs(),
      privateSubnetIds: environment.privateSubnetIds,
    });

    this.createRDSDatabase();
    this.createLambdaFunction();
    this.createApiGateway();

    this.database.grantDataApiAccess(this.lambdaFunction);
  }

  private static addMethodsToResource(resource: IResource, methods: string[]) {
    for (const method of methods) {
      resource.addMethod(method, undefined);
    }
  }

  private static hashFromFile(fileToHash: string): string {
    const fileBuffer = fs.readFileSync(fileToHash);
    const hashSum = crypto.createHash("sha256");
    hashSum.update(fileBuffer);
    return hashSum.digest("hex");
  }

  createApiGateway() {
    this.restApi = new LambdaRestApi(this, "RestApi", {
      restApiName: `${this.envName}-leapp-plugin-system-api`,
      description: `${this.envName}-leapp-plugin-system-api`,
      deployOptions: {
        stageName: "api",
      },
      proxy: false,
      handler: this.lambdaFunction,
    });

    this.createApiResources();

    Aspects.of(this.restApi).add(new PermissionAspect());
    this.lambdaFunction.addPermission("ApiPermissions", {
      action: "lambda:InvokeFunction",
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: this.restApi.arnForExecuteApi(),
    });
  }

  createLambdaFunction() {
    const layer = this.createLambdaLayer(
      "LeappPluginLayer",
      `${this.envName}-leapp-plugin-system-layer`,
      path.join(__dirname, "..", "..", "backend", "layer", "nodejs.zip"),
      path.join(__dirname, "..", "..", "..", "..", "package.json")
    );
    this.lambdaFunction = new lambda.Function(this, "LeappPluginSystemFunction", {
      functionName: `${this.envName}-leapp-plugin-system-function`,
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: path.join("app.handler"),
      layers: [layer],
      environment: {
        RDS_ARN: this.database.clusterArn,
        RDS_SECRET_ARN: this.databaseSecret.secretArn,
        RDS_DATABASE: 'postgres'
      },
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "..", "..", "..", "dist", "plugin-system", "backend")),
    });
  }

  private createLambdaLayer(id: string, layerName: string, codePath: string, fileToHash?: string) {
    let assetOptions: AssetOptions | undefined;
    if (fileToHash) {
      assetOptions = {
        assetHashType: AssetHashType.CUSTOM,
        assetHash: InfrastructureStack.hashFromFile(fileToHash),
      };
    }
    return new LayerVersion(this, id, {
      code: lambda.Code.fromAsset(codePath, assetOptions),
      compatibleRuntimes: [lambda.Runtime.NODEJS_14_X],
      layerVersionName: layerName,
    });
  }

  private createApiResources() {
    // TSOA swagger paths do not contain the base path defined in the configuration field "basePath"
    const basePathPart = "api";
    this.restApi.root.addResource(basePathPart);

    const swagger = fs.readFileSync(path.join(__dirname, "../../backend/generated/swagger.json"), { encoding: "utf8" });
    const refs = JSON.parse(swagger);
    for (const pathPart in refs.paths) {
      if (!refs.paths[pathPart]) {
        continue;
      }
      const resource = this.createPathResource(pathPart, basePathPart);
      InfrastructureStack.addMethodsToResource(resource, Object.keys(refs.paths[pathPart]));
    }
  }

  private createPathResource(fullPath: string, basePathPart: string): IResource | undefined {
    let resource = this.restApi.root.getResource(basePathPart);
    const pathParts = fullPath.replace(/^\/+|\/+$/g, "").split("/");
    for (const pathPart of pathParts) {
      if (!resource?.getResource(pathPart)) {
        resource?.addResource(pathPart);
      }
      resource = resource?.getResource(pathPart);
    }
    return resource;
  }

  private createRDSDatabase() {
    this.databaseSecret = new DatabaseSecret(this, "DatabaseSecret", {
      username: "master",
      secretName: `leapp-plugin-system-database-secret`,
    });

    this.databaseSecret.addRotationSchedule(
      "DatabaseSecretRotationSchedule",
      {
        automaticallyAfter: Duration.days(30),
        hostedRotation: HostedRotation.postgreSqlSingleUser({
          functionName: `leapp-plugin-system-database-rotate-secret`,
          vpc: this.vpc,
        }),
      }
    );

    this.databaseSecurityGroup = new SecurityGroup(
      this,
      `DatabaseSecurityGroup`,
      {
        vpc: this.vpc,
        allowAllOutbound: true,
        securityGroupName: `leapp-plugin-system-database-sg`,
        description: `Security group used by Leapp plugin system`,
      }
    );

    this.database = new ServerlessCluster(this, "RDSCluster", {
      clusterIdentifier: `leapp-plugin-system-cluster`,
      engine: DatabaseClusterEngine.AURORA_POSTGRESQL,
      enableDataApi: true,
      parameterGroup: ParameterGroup.fromParameterGroupName(
        this,
        "ParameterGroup",
        "default.aurora-postgresql10"
      ),
      vpc: this.vpc,
      scaling: {
        autoPause: Duration.minutes(10),
        minCapacity: AuroraCapacityUnit.ACU_2,
        maxCapacity: AuroraCapacityUnit.ACU_2,
      },
      credentials: Credentials.fromSecret(this.databaseSecret),
      securityGroups: [this.databaseSecurityGroup],
    });
  }
}
