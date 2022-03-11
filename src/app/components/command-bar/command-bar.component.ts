import {AfterContentChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BsModalService} from 'ngx-bootstrap/modal';
import {OptionsDialogComponent} from '../dialogs/options-dialog/options-dialog.component';
import {CreateDialogComponent} from '../dialogs/create-dialog/create-dialog.component';
import {SegmentDialogComponent} from '../dialogs/segment-dialog/segment-dialog.component';
import {WorkspaceService} from '../../services/workspace.service';
import {FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {Session} from '../../models/session';
import {AppService} from '../../services/app.service';
import {SessionType} from '../../models/session-type';
import Segment from '../../models/Segment';
import {globalOrderingFilter} from '../sessions/sessions.component';
import {syncAllEvent} from '../integration-bar/integration-bar.component';
import {Constants} from '../../models/constants';

export interface GlobalFilters {
  searchFilter: string;
  dateFilter: boolean;
  providerFilter: {show: boolean; id: string; name: string; value: boolean}[];
  profileFilter: {show: boolean; id: string; name: string; value: boolean}[];
  regionFilter: {show: boolean; name: string; value: boolean}[];
  integrationFilter: {name: string; value: boolean}[];
  typeFilter: {show: boolean; id: SessionType; category: string; name: string; value: boolean}[];
}

export const compactMode = new BehaviorSubject<boolean>(false);
export const globalFilteredSessions = new BehaviorSubject<Session[]>([]);
export const globalFilterGroup = new BehaviorSubject<GlobalFilters>(null);
export const globalHasFilter = new BehaviorSubject<boolean>(false);
export const globalResetFilter = new BehaviorSubject<boolean>(false);
export const globalSegmentFilter = new BehaviorSubject<Segment>(null);

export interface IGlobalColumns {
  role: boolean;
  provider: boolean;
  namedProfile: boolean;
  region: boolean;
}
export const globalColumns = new BehaviorSubject<IGlobalColumns>(null);

@Component({
  selector: 'app-command-bar',
  templateUrl: './command-bar.component.html',
  styleUrls: ['./command-bar.component.scss']
})
export class CommandBarComponent implements OnInit, OnDestroy, AfterContentChecked {
  @ViewChild('parent') parent: ElementRef;
  @ViewChild('child') child: ElementRef;
  overflowed = false;
  eConstants = Constants;

  filterForm = new FormGroup({
    searchFilter: new FormControl(''),
    dateFilter: new FormControl(true),
    providerFilter: new FormControl([]),
    profileFilter: new FormControl([]),
    regionFilter: new FormControl([]),
    integrationFilter: new FormControl([]),
    typeFilter: new FormControl([])
  });

  providers: {show: boolean; id: string; name: string; value: boolean}[];
  profiles: {show: boolean; id: string; name: string; value: boolean}[];
  integrations: {show: boolean; id: string; name: string; value: boolean}[];
  types: {show: boolean; id: SessionType; category: string; name: string; value: boolean}[];
  regions: {show: boolean; name: string; value: boolean}[];

  filterExtended: boolean;
  compactMode: boolean;

  private subscription;
  private subscription2;
  private subscription3;
  private subscription4;
  private subscription5;
  private subscription6;

  constructor(private bsModalService: BsModalService, public workspaceService: WorkspaceService, public appService: AppService) {
    this.filterExtended = false;
    this.compactMode = false;

    globalFilteredSessions.next(this.workspaceService.sessions);

    globalColumns.next({
      role: true,
      provider: true,
      namedProfile: true,
      region: true
    });

    this.setInitialArrayFilters();
  }

  private static changeSessionsTableHeight() {
    document.querySelector('.sessions').classList.toggle('filtered');
  }

  ngOnInit(): void {

    this.subscription = this.filterForm.valueChanges.subscribe((values: GlobalFilters) => {
      globalFilterGroup.next(values);
      this.applyFiltersToSessions(values, this.workspaceService.sessions);
    });

    this.subscription2 = globalHasFilter.subscribe(value => {
      this.filterExtended = value;
    });

    this.subscription3 = globalResetFilter.subscribe(_ => {
      this.setInitialArrayFilters();

      this.filterForm.get('searchFilter').setValue('');
      this.filterForm.get('dateFilter').setValue(true);
      this.filterForm.get('providerFilter').setValue(this.providers);
      this.filterForm.get('profileFilter').setValue(this.profiles);
      this.filterForm.get('regionFilter').setValue(this.regions);
      this.filterForm.get('integrationFilter').setValue(this.integrations);
      this.filterForm.get('typeFilter').setValue(this.types);
    });

    this.subscription4 = this.workspaceService.sessions$.subscribe(sessions => {
      const actualFilterValues: GlobalFilters = {
        dateFilter: this.filterForm.get('dateFilter').value,
        integrationFilter: this.filterForm.get('integrationFilter').value,
        profileFilter: this.filterForm.get('profileFilter').value,
        providerFilter: this.filterForm.get('providerFilter').value,
        regionFilter: this.filterForm.get('regionFilter').value,
        searchFilter: this.filterForm.get('searchFilter').value,
        typeFilter: this.filterForm.get('typeFilter').value
      };

      this.applyFiltersToSessions(actualFilterValues, sessions);
    });

    this.subscription5 = globalSegmentFilter.subscribe((segment: Segment) => {
      if(segment) {
        const values = segment.filterGroup;
        globalFilterGroup.next(values);
        this.updateFilterForm(values);
        this.applyFiltersToSessions(values, this.workspaceService.sessions);
      }
    });

    this.subscription6 = globalOrderingFilter.subscribe((sessions: Session[]) => {
      globalFilteredSessions.next(sessions);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscription2.unsubscribe();
    this.subscription3.unsubscribe();
    this.subscription4.unsubscribe();
    this.subscription5.unsubscribe();
    this.subscription6.unsubscribe();
  }

  ngAfterContentChecked(): void {
    if(this.parent && this.child) {
      const parentW = parseInt(this.parent.nativeElement.clientWidth, 10);
      const childW = parseInt(this.child.nativeElement.clientWidth, 10);
      this.overflowed = childW > parentW;
    }
  }

  showOptionDialog() {
    this.bsModalService.show(OptionsDialogComponent, { animated: false, class: 'option-modal'});
  }

  showCreateDialog() {
    this.bsModalService.show(CreateDialogComponent, { animated: false, class: 'create-modal'});
  }

  toggleCompactMode() {
    this.compactMode = !this.compactMode;
    this.filterExtended = false;

    this.appService.getCurrentWindow().unmaximize();
    this.appService.getCurrentWindow().restore();

    if(this.appService.detectOs() === Constants.mac && this.appService.getCurrentWindow().isFullScreen()) {
      this.appService.getCurrentWindow().setFullScreen(false);
      this.appService.getCurrentWindow().setMaximizable(false);
    }

    compactMode.next(this.compactMode);
    globalHasFilter.next(this.filterExtended);
    document.querySelector('.sessions').classList.remove('filtered');
  }

  toggleFilters() {
    this.filterExtended = !this.filterExtended;
    globalHasFilter.next(this.filterExtended);
    CommandBarComponent.changeSessionsTableHeight();
  }



  toggleDateFilter() {
    this.filterForm.get('dateFilter').setValue(!this.filterForm.get('dateFilter').value);
  }

  openSaveSegmentDialog() {
    this.bsModalService.show(SegmentDialogComponent, { animated: false, class: 'segment-modal'});
  }

  checkFormIsDirty() {
    return this.filterForm.get('dateFilter').value ||
           this.filterForm.get('providerFilter').value.length > 0 ||
           this.filterForm.get('profileFilter').value.length > 0 ||
           this.filterForm.get('regionFilter').value.length > 0 ||
           this.filterForm.get('integrationFilter').value.length > 0 ||
           this.filterForm.get('typeFilter').value.length > 0;
  }

  syncAll() {
    syncAllEvent.next(true);
  }

  private applyFiltersToSessions(values: GlobalFilters, sessions: Session[]) {

    let filteredSessions = sessions;
    const searchText = this.filterForm.get('searchFilter').value;
    if(searchText !== '') {
      filteredSessions = filteredSessions.filter(session => {
        let test = false;
        test ||= session.sessionName.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= session.type.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= session.region.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= (session as any).email?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= (session as any).roleArn?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= (session as any).idpArn?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= (session as any).roleSessionName?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        test ||= this.workspaceService.getProfileName((session as any).profileId)?.toLowerCase().indexOf(searchText.toLowerCase()) > -1;
        return test;
      });
    }

    if(this.filterForm.get('dateFilter').value) {
      filteredSessions = this.orderByDate(filteredSessions);
    } else {
      filteredSessions = filteredSessions.sort((a, b) => a.sessionName.localeCompare(b.sessionName));
    }

    if(this.filterForm.get('providerFilter').value.filter(v => v.value).length > 0) {
      filteredSessions = filteredSessions.filter((session) => {
        let test = false;
        this.providers.forEach(provider => {
          if(provider.value) {
            test ||= session.type.indexOf(provider.id) > -1;
          }
        });
        return test;
      });
    }

    if(this.filterForm.get('profileFilter').value.filter(v => v.value).length > 0) {
      filteredSessions = filteredSessions.filter((session) => {
        let test = false;
        this.profiles.forEach(profile => {
          if(profile.value) {
            if((session as any).profileId) {
              test ||= (session as any).profileId.indexOf(profile.id) > -1;
            }
          }
        });
        return test;
      });
    }

    if(this.filterForm.get('regionFilter').value.filter(v => v.value).length > 0) {
      filteredSessions = filteredSessions.filter((session) => {
        let test = false;
        this.regions.forEach(region => {
          if(region.value) {
            test ||= session.region.indexOf(region.name) > -1;
          }
        });
        return test;
      });
    }

    if(this.filterForm.get('integrationFilter').value.filter(v => v.value).length > 0) {
      filteredSessions = filteredSessions.filter((session) => {
        this.integrations.forEach(integration => {
            //TODO implement integration filter
        });
        return true;
      });
    }

    if(this.filterForm.get('typeFilter').value.filter(v => v.value).length > 0) {
      console.log('present');
      filteredSessions = filteredSessions.filter((session) => {
        let test = false;
        this.types.forEach(type => {
          if(type.value) {
            test ||= session.type.indexOf(type.id) > -1;
          }
        });
        return test;
      });
    }

    filteredSessions = filteredSessions.sort((x, y) => {
      if ((this.workspaceService.getWorkspace().pinned.indexOf(x.sessionId) !== -1) === (this.workspaceService.getWorkspace().pinned.indexOf(y.sessionId) !== -1)) {
        return 0;
      } else if(this.workspaceService.getWorkspace().pinned.indexOf(x.sessionId) !== -1) {
        return -1;
      } else {
        return 1;
      }
    });

    return globalFilteredSessions.next(filteredSessions);
  }

  private orderByDate(filteredSession: Session[]) {
    return filteredSession.sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }

  private updateFilterForm(values: GlobalFilters) {
    console.log('inside filter form', values);
    this.filterForm.get('searchFilter').setValue(values.searchFilter);
    this.filterForm.get('dateFilter').setValue(values.dateFilter);
    this.filterForm.get('providerFilter').setValue(values.providerFilter);
    this.filterForm.get('profileFilter').setValue(values.profileFilter);
    this.filterForm.get('regionFilter').setValue(values.regionFilter);
    this.filterForm.get('integrationFilter').setValue(values.integrationFilter);
    this.filterForm.get('typeFilter').setValue(values.typeFilter);

    if(values.providerFilter.length > 0) {
      this.providers = values.providerFilter;
      this.providers.forEach(provider => {
        provider.show = true;
      });
    }
    if(values.profileFilter.length > 0) {
      this.profiles = values.profileFilter;
      this.profiles.forEach(profile => {
        profile.show = true;
      });
    }
    if(values.regionFilter.length > 0) {
      this.regions = values.regionFilter;
      this.regions.forEach(region => {
        region.show = true;
      });
    }
    if(values.typeFilter.length > 0) {
      this.types = values.typeFilter;
      this.types.forEach(type => {
        type.show = true;
      });
    }
  }

  private setInitialArrayFilters() {
    this.providers = [
      { show: true, id: 'aws', name: 'Amazon AWS', value: false },
      { show: true, id: 'azure', name: 'Microsoft Azure', value: false }
    ];

    this.integrations = [];

    this.types = [
      { show: true, id: SessionType.awsIamRoleFederated, category: 'Amazon AWS', name: 'IAM Role Federated', value: false },
      { show: true, id: SessionType.awsIamUser, category: 'Amazon AWS', name: 'IAM User', value: false },
      { show: true, id: SessionType.awsIamRoleChained, category: 'Amazon AWS', name: 'IAM Role Chained', value: false },
      { show: true, id: SessionType.awsSsoRole, category: 'Amazon AWS', name: 'IAM Single Sign-On', value: false },
      { show: true, id: SessionType.azure, category: 'Microsoft Azure', name: 'Azure Subscription', value: false }
    ];

    this.profiles = this.workspaceService.getProfiles().map(element => ({ name: element.name, id: element.id, value: false, show: true}));

    this.regions = this.appService.getRegions().map(element => ({ name: element.region, value: false, show: true }));
  }
}
