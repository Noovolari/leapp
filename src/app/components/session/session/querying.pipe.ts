import {Pipe, PipeTransform} from '@angular/core';
import {Session} from '../../../models/session';
import {AwsFederatedSession} from '../../../models/aws-federated-session';
import {AzureSession} from '../../../models/azure-session';
import {Workspace} from '../../../models/workspace';


@Pipe({
  name: 'querying'
})
export class QueryingPipe implements PipeTransform {
  transform(sessions: Session[], query: string, workspace: Workspace): Session[] {
    if (query !== '') {
      return sessions.filter(s => {
        const idpID = workspace.idpUrls.filter(idp => idp && idp.url.toLowerCase().indexOf(query.toLowerCase()) > -1).map(m => m.id);
        return s.sessionName.toLowerCase().indexOf(query.toLowerCase()) > -1 ||
          ((s as AwsFederatedSession).roleArn && (s as AwsFederatedSession).roleArn.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (idpID.indexOf((s as AwsFederatedSession).idpUrlId) > -1) ||
          ((s as AzureSession).tenantId && (s as AzureSession).tenantId.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          ((s as AzureSession).subscriptionId && (s as AzureSession).subscriptionId.toLowerCase().indexOf(query.toLowerCase()) > -1);
      });
    }
    return sessions;
  }
}
