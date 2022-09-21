import { Component, OnDestroy, OnInit } from "@angular/core";
import { compactMode } from "../../components/command-bar/command-bar.component";
import { AppNativeService } from "../../services/app-native.service";
import { optionBarIds } from "../../components/sessions/sessions.component";
import { AppProviderService } from "../../services/app-provider.service";
import { BehaviouralSubjectService } from "@noovolari/leapp-core/services/behavioural-subject-service";

@Component({
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
  styleUrls: ["./main-layout.component.scss"],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  compactMode: boolean;

  private subscription;
  private behaviouralSubjectService: BehaviouralSubjectService;

  constructor(private appNativeService: AppNativeService, private appProviderService: AppProviderService) {
    this.subscription = compactMode.subscribe((value) => {
      this.compactMode = value;
      this.appNativeService.ipcRenderer.send("resize-window", { compactMode: this.compactMode });
      this.behaviouralSubjectService = appProviderService.behaviouralSubjectService;
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  clearOptionBarIds(): void {
    for (const prop of Object.getOwnPropertyNames(optionBarIds)) {
      optionBarIds[prop] = false;
    }
    this.behaviouralSubjectService.unselectSessions();
  }
}
