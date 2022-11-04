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
  private readonly metricsPath!: string;
  private readonly metricsMetadataPath!: string;
  private readonly metricsBackendUrl!: string;
  private metricsContent!: ITrackingMetrics;
  private metricsMetadataContent!: ITrackingMetricsMetadata;

  constructor(
    private repository: Repository,
    private fileService: FileService,
    private nativeService: INativeService,
    private logService: LogService
  ) {
    this.metricsPath = this.nativeService.path.join(this.nativeService.os.homedir(), constants.metricsPath);
    this.metricsMetadataPath = this.nativeService.path.join(this.nativeService.os.homedir(), constants.metricsMetadataPath);
    this.metricsBackendUrl = "www.url.com";

    // Files are typically initialized empty, but we also need to verify if they exist from a previous opening
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
        id: TrackingService.generateNewId(),
        lastLogTime: 0,
        lastOpened: 0,
        openedAverageTime: 0,
        openedTotalTime: 0,
        timesClosed: 1,
        timesOpened: 0,
      };
    }
    this.metricsContent.lastOpened = new Date().getTime();
    this.metricsContent.timesOpened += 1;

    if (this.fileService.existsSync(this.metricsMetadataPath)) {
      this.metricsMetadataContent = JSON.parse(this.fileService.readFileSync(this.metricsMetadataPath));
    } else {
      this.metricsMetadataContent = { allowTracking: false, alreadyAsked: false, leappVersion: "" };
    }
  }

  private static generateNewId(): string {
    return `${uuid.v4()}#${TrackingService.daySignature()}`;
  }

  private static daySignature(): string {
    const date = new Date();
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
  }

  private static isToday(metrics: ITrackingMetrics): boolean {
    const id = metrics.id;
    const date = id.split("#")[1];
    const newDate = TrackingService.daySignature();
    return date === newDate;
  }

  bootstrap(): void {
    if (!this.fileService.existsSync(this.metricsPath)) {
      this.fileService.writeFileSync(this.metricsPath, JSON.stringify(this.metricsContent, null, 4));
    }
    if (!this.fileService.existsSync(this.metricsMetadataPath)) {
      this.fileService.writeFileSync(this.metricsMetadataPath, JSON.stringify(this.metricsMetadataContent, null, 4));
    }
  }

  canTrackMetrics(): boolean {
    if (this.fileService.existsSync(this.metricsMetadataPath)) {
      try {
        this.metricsMetadataContent = JSON.parse(this.fileService.readFileSync(this.metricsMetadataPath));
        return this.metricsMetadataContent.allowTracking;
      } catch (error) {
        this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
      }
    }
  }

  trackMetrics(): void {
    if (this.fileService.existsSync(this.metricsPath)) {
      try {
        this.metricsContent = JSON.parse(this.fileService.readFileSync(this.metricsPath));
        // refresh metrics data
        this.metricsContent = this.getRefreshedMetricsData(this.metricsContent);
        // write to local file
        this.writeLocalContent(this.metricsPath, this.metricsContent);
      } catch (error) {
        this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
      }
    }
  }

  addToTimeClosed(): void {
    this.metricsContent.timesClosed += 1;
    // write to local file
    this.writeLocalContent(this.metricsPath, this.metricsContent);
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
    this.writeLocalContent(this.metricsPath, this.metricsContent);
  }

  private getRefreshedMetricsData(oldMetricsContent: ITrackingMetrics): ITrackingMetrics {
    const id = TrackingService.isToday(this.metricsContent) ? this.metricsContent.id : TrackingService.generateNewId();

    const countByType = (type: SessionType, active?: boolean): number => {
      const sessions = this.repository.getSessions();
      return sessions.filter((session) => session.type.toLowerCase().startsWith(type) && (active ? session.status === SessionStatus.active : true))
        .length;
    };

    return {
      id,
      lastLogTime: new Date().getTime(),
      lastOpened: oldMetricsContent.lastOpened,

      openedTotalTime: oldMetricsContent.openedTotalTime + constants.timeout,
      closedTotalTime: oldMetricsContent.closedTotalTime + (new Date().getTime() - oldMetricsContent.lastLogTime - constants.timeout),

      timesOpened: oldMetricsContent.timesOpened,
      timesClosed: oldMetricsContent.timesClosed,

      openedAverageTime: Math.round(oldMetricsContent.openedTotalTime / oldMetricsContent.timesOpened),
      closedAverageTime: Math.round(oldMetricsContent.closedTotalTime / oldMetricsContent.timesClosed),

      awsCount: countByType(SessionType.aws),
      awsFederatedCount: countByType(SessionType.awsIamRoleFederated),
      awsChainedCount: countByType(SessionType.awsIamRoleChained),
      awsIamUserCount: countByType(SessionType.awsIamUser),
      awsSsoCount: countByType(SessionType.awsSsoRole),
      azureCount: countByType(SessionType.azure),

      awsTotalTime: oldMetricsContent.awsTotalTime + constants.timeout * countByType(SessionType.aws, true),
      awsFederatedTotalTime: oldMetricsContent.awsFederatedTotalTime + constants.timeout * countByType(SessionType.awsIamRoleFederated, true),
      awsChainedTotalTime: oldMetricsContent.awsChainedTotalTime + constants.timeout * countByType(SessionType.awsIamRoleChained, true),
      awsIamUserTotalTime: oldMetricsContent.awsIamUserTotalTime + constants.timeout * countByType(SessionType.awsIamUser, true),
      awsSsoTotalTime: oldMetricsContent.awsSsoTotalTime + constants.timeout * countByType(SessionType.awsSsoRole, true),
      azureTotalTime: oldMetricsContent.awsFederatedTotalTime + constants.timeout * countByType(SessionType.azure, true),

      awsFederatedTotalRotations: oldMetricsContent.awsFederatedTotalRotations,
      awsChainedTotalRotations: oldMetricsContent.awsChainedTotalRotations,
      awsIamUserTotalRotations: oldMetricsContent.awsIamUserTotalRotations,
      awsSsoTotalRotations: oldMetricsContent.awsSsoTotalRotations,
      azureTotalRotations: oldMetricsContent.azureTotalRotations,
    };
  }

  private writeLocalContent(path: string, content: ITrackingMetrics | ITrackingMetricsMetadata): void {
    try {
      this.fileService.writeFileSync(path, JSON.stringify(content));
    } catch (error) {
      this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
    }
  }

  private sendLocalMetricsToServer(url: string, content: ITrackingMetrics): void {
    const postData = JSON.stringify(content);

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
