import { expect, jest, test } from "@jest/globals";
import { IntegrationIsOnlineStateRefreshService } from "./integration-is-online-state-refresh-service";

test("refreshIsOnlineState", async () => {
  let resolveCounter = 0;
  const integrations = ["integration1", "integration2", "integration3"];
  const integrationFactory = {
    getIntegrations: jest.fn(() => integrations),
    setOnline: jest.fn(
      () =>
        new Promise((resolve, _) => {
          setTimeout(() => {
            resolveCounter++;
            resolve(true);
          }, 0);
        })
    ),
  } as any;

  const behavioralSubjectService = {
    setIntegrations: jest.fn(),
  } as any;

  const service = new IntegrationIsOnlineStateRefreshService(integrationFactory, behavioralSubjectService);

  await service.refreshIsOnlineState();

  expect(integrationFactory.getIntegrations).toHaveBeenCalledTimes(2);
  expect(integrationFactory.setOnline).toHaveBeenCalledTimes(3);
  expect(integrationFactory.setOnline).toHaveBeenNthCalledWith(1, integrations[0]);
  expect(integrationFactory.setOnline).toHaveBeenNthCalledWith(2, integrations[1]);
  expect(integrationFactory.setOnline).toHaveBeenNthCalledWith(3, integrations[2]);
  expect(behavioralSubjectService.setIntegrations).toHaveBeenCalledWith(integrations);
  expect(resolveCounter).toBe(3);
});
