import { jest, describe, test, expect } from "@jest/globals";
import { AccessMethod } from "../models/access-method";
import { CloudProviderType } from "../models/cloud-provider-type";
import { SessionType } from "../models/session-type";
import { CloudProviderService } from "./cloud-provider-service";
import { IdpUrlAccessMethodField } from "../models/idp-url-access-method-field";
import { AwsSsoIntegrationService } from "./integration/aws-sso-integration-service";
import { AzureIntegrationService } from "./integration/azure-integration-service";

describe("CloudProviderService", () => {
  test("availableCloudProviders", () => {
    const service = new CloudProviderService(null, null, null, null, null);

    expect(service.availableCloudProviders()).toEqual(["aws", "azure"]);
  });

  test("getSessionTypeMap", () => {
    const map = new Map([
      [
        CloudProviderType.aws,
        [new AccessMethod(SessionType.awsIamUser, "IAM User", [], true), new AccessMethod(SessionType.awsSsoRole, "SSO Role", [], false)],
      ],
    ]);
    const service = new CloudProviderService(null, null, null, null, null);
    const spy = jest.spyOn(CloudProviderService.prototype as any, "accessMethodMap", "get").mockReturnValue(map);

    const expectedMap = new Map<SessionType, string>([
      [SessionType.awsIamUser, "IAM User"],
      [SessionType.awsSsoRole, "SSO Role"],
    ]);
    const sessionTypeLabelMap = service.getSessionTypeMap();
    expect(sessionTypeLabelMap).toEqual(expectedMap);

    spy.mockRestore();
  });

  test("creatableAccessMethods - AWS", () => {
    const awsCoreService: any = { getRegions: () => [{ region: "region1" }, { region: "region2" }] };
    const azureCoreService: any = { getLocations: () => [] };
    const repository: any = {
      getSessions: () => [
        { type: SessionType.awsIamUser, sessionName: "session1", sessionId: "s1" },
        { type: SessionType.awsIamRoleFederated, sessionName: "session2", sessionId: "s2" },
        { type: SessionType.awsIamRoleChained, sessionName: "session3", sessionId: "s3" },
        { type: SessionType.awsSsoRole, sessionName: "session4", sessionId: "s4" },
        { type: SessionType.azure, sessionName: "session5", sessionId: "s5" },
      ],
    };
    const namedProfileService: any = {
      getNamedProfiles: () => [{ name: "profileName", id: "p1" }],
    };
    const idpUrlProfileService: any = {
      getIdpUrls: () => [{ url: "idpUrl1", id: "id1" }],
    };
    const service = new CloudProviderService(awsCoreService, azureCoreService, namedProfileService, idpUrlProfileService, repository);

    const expectedRegionChoices = [
      {
        fieldName: "region1",
        fieldValue: "region1",
      },
      {
        fieldName: "region2",
        fieldValue: "region2",
      },
    ];

    const expectedNamedProfilesChoices = [
      {
        fieldName: "profileName",
        fieldValue: "p1",
      },
    ];

    const expectedIdpUrlChoices = [
      {
        fieldName: "idpUrl1",
        fieldValue: "id1",
      },
      {
        fieldName: "Create new",
        fieldValue: "CreateNewIdpUrlFieldChoice",
      },
    ];

    const accessMethods = service.creatableAccessMethods(CloudProviderType.aws);
    expect(accessMethods).toEqual([
      {
        accessMethodFields: [
          {
            creationRequestField: "sessionName",
            message: "Insert session alias",
            type: "input",
          },
          {
            creationRequestField: "accessKey",
            message: "Insert Access Key ID",
            type: "input",
          },
          {
            creationRequestField: "secretKey",
            message: "Insert Secret Access Key",
            type: "input",
          },
          {
            choices: expectedRegionChoices,
            creationRequestField: "region",
            message: "Select region",
            type: "list",
          },
          {
            creationRequestField: "mfaDevice",
            message: "Insert Mfa Device ARN",
            type: "input",
          },
          {
            choices: expectedNamedProfilesChoices,
            creationRequestField: "profileId",
            message: "Select the Named Profile",
            type: "list",
          },
        ],
        label: "IAM User",
        sessionType: "awsIamUser",
        creatable: true,
      },
      {
        accessMethodFields: [
          {
            creationRequestField: "sessionName",
            message: "Insert session alias",
            type: "input",
          },
          {
            choices: expectedRegionChoices,
            creationRequestField: "region",
            message: "Select region",
            type: "list",
          },
          {
            creationRequestField: "roleArn",
            message: "Insert Role ARN",
            type: "input",
          },
          {
            choices: expectedIdpUrlChoices,
            creationRequestField: "idpUrl",
            message: "Select the SAML 2.0 Url",
            type: "list",
          },
          {
            creationRequestField: "idpArn",
            message: "Insert the AWS Identity Provider ARN",
            type: "input",
          },
          {
            choices: expectedNamedProfilesChoices,
            creationRequestField: "profileId",
            message: "Select the Named Profile",
            type: "list",
          },
        ],
        label: "IAM Role Federated",
        sessionType: "awsIamRoleFederated",
        creatable: true,
      },
      {
        accessMethodFields: [
          {
            creationRequestField: "sessionName",
            message: "Insert session alias",
            type: "input",
          },
          {
            choices: expectedRegionChoices,
            creationRequestField: "region",
            message: "Select region",
            type: "list",
          },
          {
            creationRequestField: "roleArn",
            message: "Insert Role ARN",
            type: "input",
          },
          {
            choices: [
              {
                fieldName: "session1",
                fieldValue: "s1",
              },
              {
                fieldName: "session2",
                fieldValue: "s2",
              },
              {
                fieldName: "session4",
                fieldValue: "s4",
              },
            ],
            creationRequestField: "parentSessionId",
            message: "Select Assumer Session",
            type: "list",
          },
          {
            creationRequestField: "roleSessionName",
            message: "Role Session Name",
            type: "input",
          },
          {
            choices: expectedNamedProfilesChoices,
            creationRequestField: "profileId",
            message: "Select the Named Profile",
            type: "list",
          },
        ],
        label: "IAM Role Chained",
        sessionType: "awsIamRoleChained",
        creatable: true,
      },
    ]);

    const awsFederatedAccessMethod = accessMethods.filter((accessMethod) => accessMethod.sessionType === SessionType.awsIamRoleFederated)[0];
    const idpUrlAccessMethodField = awsFederatedAccessMethod.accessMethodFields.filter(
      (accessMethodField) => accessMethodField.creationRequestField === "idpUrl"
    )[0];
    expect(idpUrlAccessMethodField).toBeInstanceOf(IdpUrlAccessMethodField);
  });

  test("creatableAccessMethods - Azure", () => {
    const awsCoreService: any = { getRegions: () => [] };
    const azureCoreService: any = { getLocations: () => [{ location: "location1" }, { location: "location2" }] };
    const repository: any = { getSessions: () => [] };
    const namedProfileService: any = { getNamedProfiles: () => [] };
    const idpUrlProfileService: any = { getIdpUrls: () => [] };
    const service = new CloudProviderService(awsCoreService, azureCoreService, namedProfileService, idpUrlProfileService, repository);

    expect(service.creatableAccessMethods(CloudProviderType.azure)).toEqual([
      {
        accessMethodFields: [
          {
            creationRequestField: "sessionName",
            message: "Insert session alias",
            type: "input",
          },
          {
            choices: [
              {
                fieldName: "location1",
                fieldValue: "location1",
              },
              {
                fieldName: "location2",
                fieldValue: "location2",
              },
            ],
            creationRequestField: "region",
            message: "Select Location",
            type: "list",
          },
          {
            creationRequestField: "subscriptionId",
            message: "Insert Subscription Id",
            type: "input",
          },
          {
            creationRequestField: "tenantId",
            message: "Insert Tenant Id",
            type: "input",
          },
        ],
        label: "Azure",
        sessionType: "azure",
        creatable: true,
      },
    ]);
  });

  test("creatableIntegrationMethods", () => {
    const service = new CloudProviderService(null, null, null, null, null) as any;
    service.getAwsRegionChoices = () => "aws-region-choices";

    const methods = service.creatableIntegrationMethods();
    expect(methods).toEqual([
      {
        alias: "AWS Single Sign-On",
        integrationMethodFields: [
          {
            creationRequestField: "alias",
            fieldValidator: AwsSsoIntegrationService.validateAlias,
            message: "Insert integration alias",
            type: "input",
          },
          {
            creationRequestField: "portalUrl",
            fieldValidator: AwsSsoIntegrationService.validatePortalUrl,
            message: "Insert the portal url",
            type: "input",
          },
          {
            choices: "aws-region-choices",
            creationRequestField: "region",
            message: "Select region",
            type: "list",
          },
        ],
        integrationType: "AWS-SSO",
      },
      {
        alias: "Azure",
        integrationMethodFields: [
          {
            creationRequestField: "alias",
            fieldValidator: AzureIntegrationService.validateAlias,
            message: "Insert integration alias",
            type: "input",
          },
          {
            creationRequestField: "tenantId",
            fieldValidator: AzureIntegrationService.validateTenantId,
            message: "Insert the tenant id",
            type: "input",
          },
        ],
        integrationType: "AZURE",
      },
    ]);
  });

  test("availableRegions", () => {
    const awsCoreService: any = { getRegions: () => [{ region: "region1" }, { region: "region2" }] };
    const azureCoreService: any = { getLocations: () => [{ location: "location1" }, { location: "location2" }] };
    const service = new CloudProviderService(awsCoreService, azureCoreService, null, null, null);

    const awsChoices = [
      { fieldName: "region1", fieldValue: "region1" },
      { fieldName: "region2", fieldValue: "region2" },
    ];
    expect(service.availableRegions(SessionType.aws)).toEqual(awsChoices);
    expect(service.availableRegions(SessionType.awsIamUser)).toEqual(awsChoices);
    expect(service.availableRegions(SessionType.awsIamRoleChained)).toEqual(awsChoices);
    expect(service.availableRegions(SessionType.awsIamRoleFederated)).toEqual(awsChoices);
    expect(service.availableRegions(SessionType.awsSsoRole)).toEqual(awsChoices);

    const azureChoices = [
      { fieldName: "location1", fieldValue: "location1" },
      { fieldName: "location2", fieldValue: "location2" },
    ];
    expect(service.availableRegions(SessionType.azure)).toEqual(azureChoices);

    expect(service.availableRegions(SessionType.google)).toEqual([]);
  });
});
