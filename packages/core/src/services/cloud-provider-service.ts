import { AccessMethod } from "../models/access-method";
import { AccessMethodField } from "../models/access-method-field";
import { AccessMethodFieldType } from "../models/access-method-field-type";
import { CloudProviderType } from "../models/cloud-provider-type";
import { SessionType } from "../models/session-type";
import { AwsCoreService } from "./aws-core-service";
import { AWS_ASSUMER_SESSION_TYPES } from "./aws-assumer-session-types";
import { AzureCoreService } from "./azure-core-service";
import { FieldChoice } from "./field-choice";
import { NamedProfilesService } from "./named-profiles-service";
import { IdpUrlsService } from "./idp-urls-service";
import { Repository } from "./repository";
import { IdpUrlAccessMethodField } from "../models/idp-url-access-method-field";
import { IntegrationMethod } from "../models/integration-method";
import { IntegrationType } from "../models/integration-type";
import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";

export const createNewIdpUrlFieldChoice = "CreateNewIdpUrlFieldChoice";

export class CloudProviderService {
  constructor(
    private awsCoreService: AwsCoreService,
    private azureCoreService: AzureCoreService,
    private namedProfilesService: NamedProfilesService,
    private idpUrlService: IdpUrlsService,
    private repository: Repository
  ) {}

  availableCloudProviders(): CloudProviderType[] {
    return [CloudProviderType.aws, CloudProviderType.azure];
  }

  creatableAccessMethods(cloudProviderType: CloudProviderType): AccessMethod[] {
    return this.accessMethodMap.get(cloudProviderType).filter((accessMethod) => accessMethod.creatable);
  }

  creatableIntegrationMethods(): IntegrationMethod[] {
    const awsRegionChoices = this.getAwsRegionChoices();
    return [
      new IntegrationMethod(IntegrationType.awsSso, "AWS Single Sign-On", [
        new AccessMethodField("alias", "Insert integration alias", AccessMethodFieldType.input, undefined, AwsSsoIntegrationService.validateAlias),
        new AccessMethodField(
          "portalUrl",
          "Insert the portal url",
          AccessMethodFieldType.input,
          undefined,
          AwsSsoIntegrationService.validatePortalUrl
        ),
        new AccessMethodField("region", "Select region", AccessMethodFieldType.list, awsRegionChoices),
      ]),
      new IntegrationMethod(IntegrationType.azure, "Azure", [
        new AccessMethodField("alias", "Insert integration alias", AccessMethodFieldType.input, undefined, AzureIntegrationService.validateAlias),
        new AccessMethodField("tenantId", "Insert the tenant id", AccessMethodFieldType.input, undefined, AzureIntegrationService.validateTenantId),
      ]),
    ];
  }

  getSessionTypeMap(): Map<SessionType, string> {
    const accessMethods = [...this.accessMethodMap.values()].flatMap((method) => method);
    return new Map(accessMethods.map((accessMethod) => [accessMethod.sessionType, accessMethod.label] as [SessionType, string]));
  }

  availableRegions(sessionType: SessionType): FieldChoice[] {
    return this.regionMap.get(sessionType) ?? [];
  }

  private get accessMethodMap(): Map<CloudProviderType, AccessMethod[]> {
    const awsRegionChoices = this.getAwsRegionChoices();
    const awsNamedProfileChoices = this.getAwsNamedProfileChoices();
    const idpUrlChoices = this.getIdpUrls();
    const awsAssumerSessionChoices = this.getAwsAssumerSessionChoices();
    const azureLocationChoices = this.getAzureLocationChoices();

    return new Map([
      [
        CloudProviderType.aws,
        [
          new AccessMethod(
            SessionType.awsIamUser,
            "IAM User",
            [
              new AccessMethodField("sessionName", "Insert session alias", AccessMethodFieldType.input),
              new AccessMethodField("accessKey", "Insert Access Key ID", AccessMethodFieldType.input),
              new AccessMethodField("secretKey", "Insert Secret Access Key", AccessMethodFieldType.input),
              new AccessMethodField("region", "Select region", AccessMethodFieldType.list, awsRegionChoices),
              new AccessMethodField("mfaDevice", "Insert Mfa Device ARN", AccessMethodFieldType.input),
              new AccessMethodField("profileId", "Select the Named Profile", AccessMethodFieldType.list, awsNamedProfileChoices),
            ],
            true
          ),
          new AccessMethod(
            SessionType.awsIamRoleFederated,
            "IAM Role Federated",
            [
              new AccessMethodField("sessionName", "Insert session alias", AccessMethodFieldType.input),
              new AccessMethodField("region", "Select region", AccessMethodFieldType.list, awsRegionChoices),
              new AccessMethodField("roleArn", "Insert Role ARN", AccessMethodFieldType.input),
              new IdpUrlAccessMethodField("idpUrl", "Select the SAML 2.0 Url", AccessMethodFieldType.list, idpUrlChoices),
              new AccessMethodField("idpArn", "Insert the AWS Identity Provider ARN", AccessMethodFieldType.input),
              new AccessMethodField("profileId", "Select the Named Profile", AccessMethodFieldType.list, awsNamedProfileChoices),
            ],
            true
          ),
          new AccessMethod(
            SessionType.awsIamRoleChained,
            "IAM Role Chained",
            [
              new AccessMethodField("sessionName", "Insert session alias", AccessMethodFieldType.input),
              new AccessMethodField("region", "Select region", AccessMethodFieldType.list, awsRegionChoices),
              new AccessMethodField("roleArn", "Insert Role ARN", AccessMethodFieldType.input),
              new AccessMethodField("parentSessionId", "Select Assumer Session", AccessMethodFieldType.list, awsAssumerSessionChoices),
              new AccessMethodField("roleSessionName", "Role Session Name", AccessMethodFieldType.input),
              new AccessMethodField("profileId", "Select the Named Profile", AccessMethodFieldType.list, awsNamedProfileChoices),
            ],
            true
          ),
          new AccessMethod(SessionType.awsSsoRole, "AWS Single Sign-On", [], false),
        ],
      ],
      [
        CloudProviderType.azure,
        [
          new AccessMethod(
            SessionType.azure,
            "Azure",
            [
              new AccessMethodField("sessionName", "Insert session alias", AccessMethodFieldType.input),
              new AccessMethodField("region", "Select Location", AccessMethodFieldType.list, azureLocationChoices),
              new AccessMethodField("subscriptionId", "Insert Subscription Id", AccessMethodFieldType.input),
              new AccessMethodField("tenantId", "Insert Tenant Id", AccessMethodFieldType.input),
            ],
            true
          ),
        ],
      ],
      [
        CloudProviderType.localstack,
        [
          new AccessMethod(
            SessionType.localstack,
            "LocalStack",
            [
              new AccessMethodField("sessionName", "Insert session alias", AccessMethodFieldType.input),
              new AccessMethodField("region", "Select Location", AccessMethodFieldType.list, awsRegionChoices),
              new AccessMethodField("profileId", "Select the Named Profile", AccessMethodFieldType.list, awsNamedProfileChoices),
            ],
            true
          ),
        ],
      ],
    ]);
  }

  private get regionMap(): Map<SessionType, FieldChoice[]> {
    const awsRegionChoices = this.getAwsRegionChoices();
    const azureLocationChoices = this.getAzureLocationChoices();

    return new Map([
      [SessionType.aws, awsRegionChoices],
      [SessionType.awsIamUser, awsRegionChoices],
      [SessionType.awsSsoRole, awsRegionChoices],
      [SessionType.awsIamRoleFederated, awsRegionChoices],
      [SessionType.awsIamRoleChained, awsRegionChoices],
      [SessionType.azure, azureLocationChoices],
    ]);
  }

  private getAzureLocationChoices(): FieldChoice[] {
    return this.azureCoreService.getLocations().map((location) => new FieldChoice(location.location, location.location));
  }

  private getAwsRegionChoices(): FieldChoice[] {
    return this.awsCoreService.getRegions().map((value) => new FieldChoice(value.region, value.region));
  }

  private getAwsAssumerSessionChoices(): FieldChoice[] {
    return this.repository
      .getSessions()
      .filter((session) => AWS_ASSUMER_SESSION_TYPES.includes(session.type))
      .map((session) => new FieldChoice(session.sessionName, session.sessionId));
  }

  private getAwsNamedProfileChoices(): FieldChoice[] {
    return this.namedProfilesService.getNamedProfiles().map((profile) => new FieldChoice(profile.name, profile.id));
  }

  private getIdpUrls(): FieldChoice[] {
    const idpUrlsFieldChoices = this.idpUrlService.getIdpUrls().map((idpUrl) => new FieldChoice(idpUrl.url, idpUrl.id));
    return idpUrlsFieldChoices.concat(new FieldChoice("Create new", createNewIdpUrlFieldChoice));
  }
}
