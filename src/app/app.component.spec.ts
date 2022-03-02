import {TestBed, waitForAsync} from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {mustInjected} from "../base-injectables";
import {AppModule} from "./app.module";
import {UpdaterService} from "./services/updater.service";
import {ComponentsModule} from "./components/components.module";

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        AppModule,
        ComponentsModule,
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        UpdaterService
      ].concat(mustInjected())
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});
