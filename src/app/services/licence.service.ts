import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ConfigurationService} from '../services-system/configuration.service';
import {HttpClient} from '@angular/common/http';
import {NativeService} from '../services-system/native-service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LicenceService extends NativeService {

  forceLicenceOk = true;
  liteClient = environment.liteClient;

  constructor(
    private configurationService: ConfigurationService,
    private httpClient: HttpClient
  ) { super(); }

  /**
   * Retrieve The unique ID of a machine
   * @returns - {boolean} - the unique ID
   */
  retrieveUID() {
    return this.MachineId;
  }

  checkLicence(): Observable<any> {
    return new Observable<any>(observer => {

      if (this.forceLicenceOk) {
        observer.next(true);
        observer.complete();
      }

      const configuration = this.configurationService.getConfigurationFileSync();
      const workspace = this.configurationService.getDefaultWorkspaceSync();

      // Check if we already have the information we need to make a final
      // check online otherwise we can safely go to the new licence page
      console.log(configuration.uid, workspace.name);
      if ((configuration.licence !== '' && configuration.uid !== '' && workspace.name)) {
        this.checkOnlineLicence(configuration.licence, configuration.uid, workspace.name).subscribe(() => {

          // We have checked online and we are good to go
          observer.next(true);
          observer.complete();
        }, () => {

          // Some problem occurred with online check decide what we want to do
          observer.error({newLicence: false, message: 'your licence and/or uid doesn\'t match'});
          observer.complete();
        });
      } else {

        // Fresh install go to new licence page
        observer.error({ newLicence: true, message: '' });
        observer.complete();
      }

    });
  }

  /**
   * Check the licence online
   * @param licence - {string}
   * @param uid - {string}
   * @param workspace - {string}
   */
  checkOnlineLicence(licence: string, uid: string, workspace: string): Observable<any> {
    return new Observable<boolean>(observer => {
      this.httpClient.post(environment.apiGateway.url + 'licences/activate', {
        licence,
        machineId: uid,
        workspace,
        type: this.liteClient ? 'LITE' : 'ENTERPRISE'
      }).subscribe(() => {
        console.log();
        observer.next(true);
        observer.complete();
      }, err => {
        console.log();
        observer.error(err.toString());
        observer.complete();
      });
    });
  }
}
