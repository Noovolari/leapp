import { Component, OnDestroy, OnInit } from "@angular/core";
import { compactMode } from "../../components/command-bar/command-bar.component";
import { AppNativeService } from "../../services/app-native.service";
import { optionBarIds } from "../../components/sessions/sessions.component";

@Component({
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
  styleUrls: ["./main-layout.component.scss"],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  compactMode: boolean;

  private subscription;

  constructor(private electronService: AppNativeService) {
    this.subscription = compactMode.subscribe((value) => {
      this.compactMode = value;
      this.electronService.ipcRenderer.send("resize-window", { compactMode: this.compactMode });
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
    document.querySelector(".sessions").classList.remove("option-bar-opened");
  }
}
