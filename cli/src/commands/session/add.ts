import { AccessMethod } from "@noovolari/leapp-core/models/access-method";
import { CloudProviderType } from "@noovolari/leapp-core/models/cloud-provider-type";
import { LeappCommand } from "../../leapp-command";
import { Config } from "@oclif/core/lib/config/config";
import { IdpUrlAccessMethodField } from "@noovolari/leapp-core/models/idp-url-access-method-field";
import CreateIdpUrl from "../idp-url/create";
import {
  providerType,
  accessKey,
  idpArn,
  idpUrl,
  mfaDevice,
  sessionName,
  parentSessionId,
  profileId,
  region,
  roleArn,
  roleSessionName,
  secretKey,
  subscriptionId,
  tenantId,
  sessionType,
} from "../../flags";
import { SessionType } from "@noovolari/leapp-core/models/session-type";

export default class AddSession extends LeappCommand {
  static description = "Add a new session";
  static examples = [
    "$leapp session add",
    "$leapp session add --providerType [aws, azure] --sessionType [awsIamRoleFederated, awsIamRoleChained, awsIamUser, azure] --region [AWSREGION, AZURELOCATION] --sessionName NAME ...[combination of flags relative to the session]",
    "$leapp session add --providerType azure --sessionType azure --sessionName NAME --region AZURELOCATION --tenantID TENANTID --subscriptionId SUBSCRIPTIONID",
    "$leapp session add --providerType aws --sessionType awsIamRoleFederated --sessionName NAME --region AWSREGION --idpArn IDPARN --idpUrl IDPURL --profileId PROFILEID --roleArn ROLEARN",
    "$leapp session add --providerType aws --sessionType awsIamRoleChained --sessionName NAME --region AWSREGION --profileId PROFILEID --roleArn ROLEARN --parentSessionUId ID (--roleSessionName ROLESESSIONNAME)",
    "$leapp session add --providerType aws --sessionType awsIamUser --sessionName NAME --region AWSREGION --profileId PROFILEID --accessKey ACCESSKEY --secretKey SECRETKEY (--mfaDevice MFADEVICEARN)",
  ];

  static flags = {
    providerType,
    accessKey,
    idpArn,
    idpUrl,
    mfaDevice,
    sessionName,
    parentSessionId,
    profileId,
    region,
    roleArn,
    roleSessionName,
    secretKey,
    subscriptionId,
    tenantId,
    sessionType,
  };

  constructor(argv: string[], config: Config, private createIdpUrlCommand: CreateIdpUrl = new CreateIdpUrl(argv, config)) {
    super(argv, config);
  }

  async run(): Promise<void> {
    try {
      const { flags } = await this.parse(AddSession);
      if (this.verifyFlags(flags)) {
        const selectedCloudProvider = this.extractProviderFromFlags(flags);
        const selectedAccessMethod = this.extractAccessMethodFromFlags(flags, selectedCloudProvider);
        const selectedParams = this.extractCorrectParamsFromFlags(flags, selectedAccessMethod);
        await this.createSession(selectedAccessMethod, selectedParams);
      } else {
        const selectedCloudProvider = await this.chooseCloudProvider();
        const selectedAccessMethod = await this.chooseAccessMethod(selectedCloudProvider);
        const selectedParams = await this.chooseAccessMethodParams(selectedAccessMethod);
        await this.createSession(selectedAccessMethod, selectedParams);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : `Unknown error: ${error}`);
    }
  }

  async createSession(accessMethod: AccessMethod, selectedParams: Map<string, string>): Promise<void> {
    const creationRequest = accessMethod.getSessionCreationRequest(selectedParams);
    await this.cliProviderService.sessionFactory.createSession(accessMethod.sessionType, creationRequest);
    await this.cliProviderService.remoteProceduresClient.refreshSessions();
    this.log("session added");
  }

  async chooseCloudProvider(): Promise<CloudProviderType> {
    const availableCloudProviders = this.cliProviderService.cloudProviderService.availableCloudProviders();
    const cloudProviderAnswer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedProvider",
        message: "select a provider",
        type: "list",
        choices: availableCloudProviders.map((cloudProvider: any) => ({ name: cloudProvider })),
      },
    ]);
    return cloudProviderAnswer.selectedProvider;
  }

  async chooseAccessMethod(cloudProviderType: CloudProviderType): Promise<AccessMethod> {
    const accessMethods = this.cliProviderService.cloudProviderService.creatableAccessMethods(cloudProviderType);
    const accessMethodAnswer: any = await this.cliProviderService.inquirer.prompt([
      {
        name: "selectedMethod",
        message: "select an access method",
        type: "list",
        choices: accessMethods.map((accessMethod: any) => ({ name: accessMethod.label, value: accessMethod })),
      },
    ]);
    return accessMethodAnswer.selectedMethod;
  }

  async chooseAccessMethodParams(selectedAccessMethod: AccessMethod): Promise<Map<string, string>> {
    const fieldValuesMap = new Map<string, string>();
    for (const field of selectedAccessMethod.accessMethodFields) {
      const fieldAnswer: any = await this.cliProviderService.inquirer.prompt([
        {
          name: field.creationRequestField,
          message: field.message,
          type: field.type,
          choices: field.choices?.map((choice: any) => ({ name: choice.fieldName, value: choice.fieldValue })),
        },
      ]);
      let fieldAnswerValue = fieldAnswer[field.creationRequestField];
      if (field instanceof IdpUrlAccessMethodField && field.isIdpUrlToCreate(fieldAnswerValue)) {
        const newIdpUrl = await this.createIdpUrlCommand.promptAndCreateIdpUrl();
        fieldAnswerValue = newIdpUrl.id;
      }
      fieldValuesMap.set(field.creationRequestField, fieldAnswerValue);
    }

    return fieldValuesMap;
  }

  private extractProviderFromFlags(flags: any): string {
    if (flags.providerType && flags.providerType !== "") {
      if (flags.providerType.indexOf(SessionType.aws.toString()) < 0 && flags.providerType.indexOf(SessionType.azure.toString()) < 0) {
        throw new Error("Provider Type is not valid");
      } else {
        return flags.providerType;
      }
    } else {
      throw new Error("Provider Type Flag cannot be empty");
    }
  }

  private verifyFlags(flags: any) {
    const firstStep =
      flags.providerType &&
      flags.providerType !== "" &&
      flags.sessionName &&
      flags.sessionName !== "" &&
      flags.region &&
      flags.region !== "" &&
      flags.sessionType &&
      flags.sessionType !== "";

    const secondStep =
      // AZURE
      (flags.providerType === SessionType.azure.toString() &&
        flags.tenantId &&
        flags.tenantId !== "" &&
        flags.subscriptionId &&
        flags.subscriptionId !== "") ||
      // AWS IAM ROLE CHAINED
      (flags.providerType === SessionType.aws.toString() &&
        flags.sessionType === SessionType.awsIamRoleChained.toString() &&
        flags.roleArn &&
        flags.roleArn !== "" &&
        flags.parentSessionId &&
        flags.parentSessionId !== "") ||
      // AWS IAM ROLE FEDERATED
      (flags.providerType === SessionType.aws.toString() &&
        flags.sessionType === SessionType.awsIamRoleFederated.toString() &&
        flags.idpUrl &&
        flags.idpUrl !== "" &&
        flags.idpArn &&
        flags.idpArn !== "" &&
        flags.roleArn &&
        flags.roleArn !== "") ||
      // AWS IAM USER
      (flags.providerType === SessionType.aws.toString() &&
        flags.sessionType === SessionType.awsIamUser.toString() &&
        flags.secretKey &&
        flags.secretKey !== "" &&
        flags.accessKey &&
        flags.accessKey !== "");

    return firstStep && secondStep;
  }

  private extractAccessMethodFromFlags(flags: any, cloudProvider: string): AccessMethod {
    if (
      (flags.sessionType.indexOf(SessionType.aws.toString()) && cloudProvider === SessionType.azure.toString()) ||
      (flags.sessionType === SessionType.azure && cloudProvider === SessionType.aws.toString())
    ) {
      throw new Error("Session Type and Provider Type are not valid together");
    }

    const accessMethods = this.cliProviderService.cloudProviderService.creatableAccessMethods(cloudProvider as CloudProviderType);
    return accessMethods.filter((aM: AccessMethod) => aM.label === flags.sessionType)[0];
  }

  private extractCorrectParamsFromFlags(flags: any, selectedAccessMethod: AccessMethod): Map<string, string> {
    const fieldValuesMap = new Map<string, string>();

    for (const field of selectedAccessMethod.accessMethodFields) {
      let fieldAnswerValue = flags[field.creationRequestField];
      if (!fieldAnswerValue && field.creationRequestField !== "mfaDevice" && field.creationRequestField !== "profileId") {
        throw new Error(`Property ${field.creationRequestField} was not found for given Access Method`);
      }
      if (!fieldAnswerValue && field.creationRequestField === "mfaDevice") {
        fieldAnswerValue = "";
      }
      if (!fieldAnswerValue && field.creationRequestField === "profileId") {
        fieldAnswerValue = this.cliProviderService.repository.getDefaultProfileId();
      }
      fieldValuesMap.set(field.creationRequestField, fieldAnswerValue);
    }

    return fieldValuesMap;
  }
}
