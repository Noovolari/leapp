import { SessionFactory } from "./session-factory";
import { Repository } from "./repository";
import * as uuid from "uuid";
import { Session } from "../models/session";
import { IdpUrl } from "../models/idp-url";
import { AwsIamRoleFederatedSession } from "../models/aws/aws-iam-role-federated-session";

export class IdpUrlsService {
  constructor(private sessionFactory: SessionFactory, private repository: Repository) {}

  getIdpUrls(): IdpUrl[] {
    return this.repository.getIdpUrls();
  }

  getIdpUrl(id: string): IdpUrl {
    const idpUrl = this.repository.getIdpUrl(id);
    if (idpUrl) {
      return new IdpUrl(id, idpUrl);
    } else return null;
  }

  /**
   * Get or create the AWS IdPUrl ID from the unique name
   *
   * @param url
   * @return id the IdP URL id if the given URL if the idpUrl exists, otherwise creates a new IdPUrl and returns its id
   */
  getIdpUrlIdByUrl(url: string): string {
    const idpUrlId = this.getIdpUrls().find((idpUrl) => idpUrl.url === url)?.id;
    if (!idpUrlId) {
      return this.createIdpUrl(url).id;
    }
    return idpUrlId;
  }

  createIdpUrl(idpUrl: string): IdpUrl {
    const newIdpUrl = new IdpUrl(this.getNewId(), idpUrl.trim());
    this.repository.addIdpUrl(newIdpUrl);
    return newIdpUrl;
  }

  editIdpUrl(id: string, newIdpUrl: string): void {
    this.repository.updateIdpUrl(id, newIdpUrl.trim());
  }

  async deleteIdpUrl(id: string): Promise<void> {
    for (const sessionToDelete of this.getDependantSessions(id, false)) {
      const sessionService = this.sessionFactory.getSessionService(sessionToDelete.type);
      await sessionService.delete(sessionToDelete.sessionId);
    }
    this.repository.removeIdpUrl(id);
  }

  validateIdpUrl(url: string): boolean | string {
    const trimmedUrl = url.trim();
    if (trimmedUrl.length === 0) {
      return "Empty IdP URL";
    }

    const isUrl = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
    if (!isUrl) {
      return "IdP URL is not a valid URL";
    }

    const existingUrls = this.getIdpUrls().map((idpUrl) => idpUrl.url);
    if (existingUrls.includes(trimmedUrl)) {
      return "IdP URL already exists";
    }
    return true;
  }

  getDependantSessions(idpUrlId: string, includingChained: boolean = true): Session[] {
    const dependantSessions = this.repository.getSessions().filter((session) => (session as AwsIamRoleFederatedSession).idpUrlId === idpUrlId);
    return includingChained
      ? dependantSessions.flatMap((parentSession) => [parentSession, ...this.repository.listIamRoleChained(parentSession)])
      : dependantSessions;
  }

  mergeIdpUrl(url: string): IdpUrl {
    const actualIdpUrl = this.repository.getIdpUrls().find((idpUrl) => idpUrl.url === url);
    if (actualIdpUrl) {
      return actualIdpUrl;
    } else {
      return this.createIdpUrl(url);
    }
  }

  private getNewId() {
    return uuid.v4();
  }
}
