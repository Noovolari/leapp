import { Component, Input, OnInit, ViewEncapsulation } from "@angular/core";
import { Session } from "@noovolari/leapp-core/models/session";
import { AppService } from "../../../services/app.service";
import { AppProviderService } from "../../../services/app-provider.service";
import { MessageToasterService, ToastLevel } from "../../../services/message-toaster.service";

export const containerColors: { name: string; hex: string }[] = [
  { name: "toolbar", hex: "#7c7c7d" },
  { name: "red", hex: "#ff0039" },
  { name: "pink", hex: "#ff84a3" },
  { name: "orange", hex: "#ff9f00" },
  { name: "yellow", hex: "#ffcb00" },
  { name: "green", hex: "#51cd00" },
  { name: "turquoise", hex: "#00c79a" },
  { name: "blue", hex: "#37adff" },
  { name: "purple", hex: "#af51f5" },
];

@Component({
  selector: "app-change-color-dialog",
  templateUrl: "./change-color-dialog.component.html",
  styleUrls: ["./change-color-dialog.component.scss"],
  encapsulation: ViewEncapsulation.None,
})
export class ChangeColorDialogComponent implements OnInit {
  @Input()
  public session: Session;

  public colors = containerColors;
  public selectedColor: string;

  constructor(
    private readonly appService: AppService,
    private readonly appProviderService: AppProviderService,
    private readonly messageToasterService: MessageToasterService
  ) {}

  ngOnInit(): void {
    this.selectedColor = this.session.color ?? null;
  }

  closeModal(): void {
    this.appService.closeModal();
  }

  selectColor(colorName: string): void {
    this.selectedColor = colorName;
  }

  saveColor(): void {
    if (this.selectedColor) {
      this.session.color = this.selectedColor;
      this.appProviderService.repository.updateSession(this.session.sessionId, this.session);
      this.appProviderService.behaviouralSubjectService.setSessions(this.appProviderService.repository.getSessions());
      this.messageToasterService.toast("Color has been changed!", ToastLevel.success, "Color changed!");
      this.closeModal();
    }
  }
}
