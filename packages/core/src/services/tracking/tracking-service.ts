import { Repository } from "../repository";
import { FileService } from "../file-service";
import { INativeService } from "../../interfaces/i-native-service";
import { constants } from "../../models/constants";
import { ITrackingMetrics, ITrackingMetricsMetadata } from "./i-tracking";
import { LoggedException, LogLevel, LogService } from "../log-service";
import { SessionType } from "../../models/session-type";

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
    this.metricsContent = {
      awsChainedCount: 0,
      awsChainedTotalRotations: 0,
      awsChainedTotalTime: 0,
      awsCount: 0,
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
      id: "",
      lastOpened: "",
      openedAverageTime: 0,
      openedTotalTime: 0,
      timesClosed: 0,
      timesOpened: 0,
    };
    this.metricsMetadataContent = { allowTracking: false, alreadyAsked: false, leappVersion: "" };
    this.metricsBackendUrl = "www.url.com";
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
      } catch (error) {
        this.logService.log(new LoggedException(error.message, this, LogLevel.error, false, error.stackTrace));
      }
    }
  }

  private getRefreshedMetricsData(oldMetricsContent: ITrackingMetrics): ITrackingMetrics {
    const sessions = this.repository.getSessions();
    return {
      id: this.metricsContent.id,
      lastOpened: "",
      openedTotalTime: oldMetricsContent.openedTotalTime + 1,
      closedTotalTime: oldMetricsContent.closedTotalTime + 1,
      timesOpened: oldMetricsContent.timesOpened + 1,
      timesClosed: oldMetricsContent.timesClosed + 1,
      openedAverageTime: oldMetricsContent.openedAverageTime + 1,
      closedAverageTime: oldMetricsContent.closedAverageTime + 1,
      awsCount: sessions.filter((session) => session.type.toLowerCase().startsWith("aws")).length,
      awsFederatedCount: sessions.filter((session) => session.type === SessionType.awsIamRoleFederated).length,
      awsChainedCount: sessions.filter((session) => session.type === SessionType.awsIamRoleChained).length,
      awsIamUserCount: sessions.filter((session) => session.type === SessionType.awsIamUser).length,
      awsSsoCount: sessions.filter((session) => session.type === SessionType.awsSsoRole).length,
      azureCount: sessions.filter((session) => session.type === SessionType.azure).length,
      awsFederatedTotalTime: oldMetricsContent.awsFederatedTotalTime + 1,
      awsChainedTotalTime: oldMetricsContent.awsChainedTotalTime + 1,
      awsIamUserTotalTime: oldMetricsContent.awsIamUserTotalTime + 1,
      awsSsoTotalTime: oldMetricsContent.awsSsoTotalTime + 1,
      azureTotalTime: oldMetricsContent.azureTotalTime + 1,
      awsFederatedTotalRotations: oldMetricsContent.awsFederatedTotalRotations + 1,
      awsChainedTotalRotations: oldMetricsContent.awsChainedTotalRotations + 1,
      awsIamUserTotalRotations: oldMetricsContent.awsIamUserTotalRotations + 1,
      awsSsoTotalRotations: oldMetricsContent.awsSsoTotalRotations + 1,
      azureTotalRotations: oldMetricsContent.azureTotalRotations + 1,
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
