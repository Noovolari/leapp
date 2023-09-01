import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { AppProviderService } from "../../services/app-provider.service";
import { AppService } from "../../services/app.service";
import { constants } from "@noovolari/leapp-core/models/constants";
import { BehaviorSubject } from "rxjs";

export const colorThemeSubject = new BehaviorSubject(false);

@Component({
  selector: "app-check-icon-svg",
  templateUrl: "./check-icon-svg.component.html",
  styleUrls: ["./check-icon-svg.component.scss"],
})
export class CheckIconSvgComponent implements OnInit, OnDestroy {
  @Input()
  color: string;
  subscription;
  originalColor: string;
  constructor(private appProviderService: AppProviderService, private appService: AppService) {
    this.color = "#000000";
    this.subscription = colorThemeSubject.subscribe((value) => {
      if (value) {
        if (
          this.appProviderService.workspaceService.extractGlobalSettings().colorTheme === constants.darkTheme ||
          (this.appProviderService.workspaceService.extractGlobalSettings().colorTheme === constants.systemDefaultTheme &&
            this.appService.isDarkMode())
        ) {
          this.color = "#ffffff";
        }
      } else {
        this.color = this.originalColor;
      }
    });
  }

  ngOnInit(): void {
    if (
      this.appProviderService.workspaceService.extractGlobalSettings().colorTheme === constants.darkTheme ||
      (this.appProviderService.workspaceService.extractGlobalSettings().colorTheme === constants.systemDefaultTheme && this.appService.isDarkMode())
    ) {
      this.color = "#ffffff";
    }
    this.originalColor = this.color;
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
