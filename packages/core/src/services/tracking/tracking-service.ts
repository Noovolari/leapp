import { Repository } from "../repository";
import { FileService } from "../file-service";
import { INativeService } from "../../interfaces/i-native-service";
import { constants } from "../../models/constants";
import { ITrackingMetrics, ITrackingMetricsMetadata } from "./i-tracking";
import { LoggedException, LogLevel, LogService } from "../log-service";
import { SessionType } from "../../models/session-type";
import * as uuid from "uuid";
import { Session } from "../../models/session";
import { SessionStatus } from "../../models/session-status";

export class TrackingService {
  private metricsContent!: ITrackingMetrics;
  private metricsMetadataContent!: ITrackingMetricsMetadata;
  private lastSendTime: number;
  private readonly metricsPath: string;
  private readonly metricsMetadataPath: string;
  private readonly metricsBackendUrl: string;

  constructor(
    private repository: Repository,
    private fileService: FileService,
    private nativeService: INativeService,
    private logService: LogService,
    private leappVersion: string
  ) {
    const homeDir = this.nativeService.os.homedir();
    this.metricsPath = this.nativeService.path.join(homeDir, constants.metricsPath);
    this.metricsMetadataPath = this.nativeService.path.join(homeDir, constants.metricsMetadataPath);
    this.metricsBackendUrl = "www.url.com"; // TODO: set to the real value
    this.lastSendTime = 0;
    this.bootstrap();
  }

  private static generateNewMetricId(): string {
    return `${uuid.v4()}#${TrackingService.daySignature()}`;
  }

  private static daySignature(): string {
    const date = new Date();
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  }

  private static isTodayMetrics(metrics: ITrackingMetrics): boolean {
    const id = metrics.id;
    const date = id.split("#")[1];
    const newDate = TrackingService.daySignature();
    return date === newDate;
  }

  trackMetrics(): void {
    try {
      // refresh metrics data
      this.metricsContent = this.getRefreshedMetricsData(this.metricsContent);
      // write to local file
      this.persistsMetricsContent();
      const now = new Date().getTime();
      const elapsedTime = now - this.lastSendTime;
      if (this.metricsMetadataContent.allowSendingMetrics && elapsedTime > constants.sendMetricsIntervalInMs) {
        this.sendLocalMetricsToServer(this.metricsBackendUrl, this.metricsContent);
        this.lastSendTime = now;
      }
    } catch (error) {
      this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
    }
  }

  addToTimeClosed(): void {
    this.metricsContent.timesClosed += 1;
    // write to local file
    this.persistsMetricsContent();
  }

  addToRotationByType(session: Session): void {
    switch (session.type) {
      case SessionType.alibaba:
        break;
      case SessionType.google:
        break;

      case SessionType.awsIamRoleFederated:
        this.metricsContent.awsFederatedTotalRotations += 1;
        break;
      case SessionType.awsIamRoleChained:
        this.metricsContent.awsChainedTotalRotations += 1;
        break;
      case SessionType.awsIamUser:
        this.metricsContent.awsIamUserTotalRotations += 1;
        break;
      case SessionType.awsSsoRole:
        this.metricsContent.awsSsoTotalRotations += 1;
        break;
      case SessionType.azure:
        this.metricsContent.azureTotalRotations += 1;
        break;
    }
    // write to local file
    this.persistsMetricsContent();
  }

  async checkConsensus(askUserConsensus: () => Promise<boolean>): Promise<void> {
    const versionNotBumped = this.metricsMetadataContent.leappVersion === this.leappVersion;
    if (this.metricsMetadataContent.alreadyAsked && versionNotBumped) {
      return;
    }
    this.metricsMetadataContent.allowSendingMetrics = await askUserConsensus();
    this.metricsMetadataContent.alreadyAsked = true;
    this.metricsMetadataContent.leappVersion = this.leappVersion;
    this.persistsMetricsMetadataContent();
  }

  private bootstrap(): void {
    // Files are typically initialized empty, but we also need to verify if they exist from a previous opening
    const now = new Date().getTime();

    if (this.fileService.existsSync(this.metricsPath)) {
      this.metricsContent = JSON.parse(this.fileService.readFileSync(this.metricsPath));
    } else {
      this.metricsContent = {
        awsChainedCount: 0,
        awsChainedTotalRotations: 0,
        awsChainedTotalTime: 0,
        awsCount: 0,
        awsTotalTime: 0,
        awsFederatedCount: 0,
        awsFederatedTotalRotations: 0,
        awsFederatedTotalTime: 0,
        awsIamUserCount: 0,
        awsIamUserTotalRotations: 0,
        awsIamUserTotalTime: 0,
        awsSsoCount: 0,
        awsSsoTotalRotations: 0,
        awsSsoTotalTime: 0,
        azureCount: 0,
        azureTotalRotations: 0,
        azureTotalTime: 0,
        closedAverageTime: 0,
        closedTotalTime: 0,
        id: TrackingService.generateNewMetricId(),
        lastLogTime: now - constants.rotationIntervalInMs,
        lastOpened: 0,
        openedAverageTime: 0,
        openedTotalTime: 0,
        timesClosed: 1,
        timesOpened: 0,
      };
    }
    this.metricsContent.lastOpened = now;
    this.metricsContent.timesOpened += 1;
    this.persistsMetricsContent();

    if (this.fileService.existsSync(this.metricsMetadataPath)) {
      this.metricsMetadataContent = JSON.parse(this.fileService.readFileSync(this.metricsMetadataPath));
    } else {
      this.metricsMetadataContent = { allowSendingMetrics: false, alreadyAsked: false, leappVersion: this.leappVersion };
      this.persistsMetricsMetadataContent();
    }
  }

  private countSessions(type: SessionType, active: boolean = false): number {
    const sessions = this.repository.getSessions();
    return sessions.filter((session) => session.type.startsWith(type) && (active ? session.status === SessionStatus.active : true)).length;
  }

  private getRefreshedMetricsData(oldMetrics: ITrackingMetrics): ITrackingMetrics {
    const id = TrackingService.isTodayMetrics(oldMetrics) ? oldMetrics.id : TrackingService.generateNewMetricId();

    const now = new Date().getTime();
    return {
      id,
      lastLogTime: now,
      lastOpened: oldMetrics.lastOpened,

      openedTotalTime: oldMetrics.openedTotalTime + constants.rotationIntervalInMs,
      closedTotalTime: oldMetrics.closedTotalTime + (now - oldMetrics.lastLogTime - constants.rotationIntervalInMs),

      timesOpened: oldMetrics.timesOpened,
      timesClosed: oldMetrics.timesClosed,

      openedAverageTime: Math.round(oldMetrics.openedTotalTime / oldMetrics.timesOpened),
      closedAverageTime: Math.round(oldMetrics.closedTotalTime / oldMetrics.timesClosed),

      awsCount: this.countSessions(SessionType.aws),
      awsFederatedCount: this.countSessions(SessionType.awsIamRoleFederated),
      awsChainedCount: this.countSessions(SessionType.awsIamRoleChained),
      awsIamUserCount: this.countSessions(SessionType.awsIamUser),
      awsSsoCount: this.countSessions(SessionType.awsSsoRole),
      azureCount: this.countSessions(SessionType.azure),

      awsTotalTime: oldMetrics.awsTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.aws, true),
      awsFederatedTotalTime:
        oldMetrics.awsFederatedTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.awsIamRoleFederated, true),
      awsChainedTotalTime: oldMetrics.awsChainedTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.awsIamRoleChained, true),
      awsIamUserTotalTime: oldMetrics.awsIamUserTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.awsIamUser, true),
      awsSsoTotalTime: oldMetrics.awsSsoTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.awsSsoRole, true),
      azureTotalTime: oldMetrics.azureTotalTime + constants.rotationIntervalInMs * this.countSessions(SessionType.azure, true),

      awsFederatedTotalRotations: oldMetrics.awsFederatedTotalRotations,
      awsChainedTotalRotations: oldMetrics.awsChainedTotalRotations,
      awsIamUserTotalRotations: oldMetrics.awsIamUserTotalRotations,
      awsSsoTotalRotations: oldMetrics.awsSsoTotalRotations,
      azureTotalRotations: oldMetrics.azureTotalRotations,
    };
  }

  private persistsMetricsContent(): void {
    try {
      this.fileService.writeFileSync(this.metricsPath, JSON.stringify(this.metricsContent, null, 4));
    } catch (error) {
      this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
    }
  }

  private persistsMetricsMetadataContent(): void {
    try {
      this.fileService.writeFileSync(this.metricsMetadataPath, JSON.stringify(this.metricsMetadataContent, null, 4));
    } catch (error) {
      this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
    }
  }

  private sendLocalMetricsToServer(url: string, content: ITrackingMetrics): void {
    const postData = JSON.stringify(content, null, 4);

    const options = {
      hostname: this.nativeService.url.host(url),
      port: 443,
      path: this.nativeService.url.pathName(url),
      method: "POST",
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Length": postData.length,
      },
    };

    const req = this.nativeService.https.request(options, (res) => {
      console.log("statusCode:", res.statusCode);
      console.log("headers:", res.headers);

      res.on("data", (d) => {
        process.stdout.write(d);
      });
    });

    req.on("error", (e) => {
      console.error(e);
    });

    req.write(postData);
    req.end();
  }
}
