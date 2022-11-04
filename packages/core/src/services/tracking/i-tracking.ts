export interface ITrackingMetrics {
  id: string;
  lastLogTime: number;

  // we need them for calculate how much time the application is left opened or closed
  lastOpened: number;
  openedTotalTime: number;
  closedTotalTime: number;

  // increased every time leapp is opened or closed
  timesOpened: number;
  timesClosed: number;

  openedAverageTime: number;
  closedAverageTime: number;

  // session metrics
  awsCount: number;
  awsFederatedCount: number;
  awsChainedCount: number;
  awsIamUserCount: number;
  awsSsoCount: number;
  azureCount: number;

  awsTotalTime: number;
  awsFederatedTotalTime: number;
  awsChainedTotalTime: number;
  awsIamUserTotalTime: number;
  awsSsoTotalTime: number;
  azureTotalTime: number;

  awsFederatedTotalRotations: number;
  awsChainedTotalRotations: number;
  awsIamUserTotalRotations: number;
  awsSsoTotalRotations: number;
  azureTotalRotations: number;
}

export interface ITrackingMetricsMetadata {
  allowTracking: boolean;
  alreadyAsked: boolean;
  leappVersion: string;
}
