import { AfterViewInit, Component, EventEmitter, Input, Output, SecurityContext, ViewChild } from "@angular/core";
import { NgSelectComponent } from "@ng-select/ng-select";
import { FormGroup } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { AppProviderService } from "../../services/app-provider.service";
import { LoggedEntry, LogLevel } from "@noovolari/leapp-core/services/log-service";

@Component({
  selector: "app-leapp-select",
  templateUrl: "./leapp-select.component.html",
  styleUrls: ["./leapp-select.component.scss"],
})
export class LeappSelectComponent implements AfterViewInit {
  @ViewChild("ngSelectComponent")
  ngSelectComponent: NgSelectComponent;

  @Input()
  addTag: boolean;

  @Input()
  ngModel: any;

  @Input()
  placeholder: string;

  @Input()
  controlName: string;

  @Input()
  form: FormGroup;

  @Input()
  bindLabel: string;

  @Input()
  bindValue: string;

  @Input()
  items: any[];

  @Input()
  dropdownPosition: string;

  @Input()
  defaultNewValue: any;

  @Input()
  whatToAddName: string;

  @Input()
  uppercased: boolean;

  @Output()
  selected = new EventEmitter<{ items: any[]; item: any }>();

  temporaryName: string;

  constructor(private domSanitizer: DomSanitizer, private appProviderService: AppProviderService) {
    this.temporaryName = "";
    this.uppercased = this.uppercased || true;
  }

  private static isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  }

  ngAfterViewInit(): void {
    this.ngSelectComponent.handleClearClick();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setTemporaryName($event: any): void {
    this.temporaryName = $event.target.value;
  }

  checkNewElement(): boolean {
    return this.temporaryName !== "" && this.items.filter((s) => s[this.bindLabel].indexOf(this.temporaryName) > -1).length === 0;
  }

  addNewElement(): void {
    if (this.checkCrossScriptingInjection(this.temporaryName)) {
      this.appProviderService.logService.log(
        new LoggedEntry("Attention, your inputted data is potentially unsafe and would led to a XSS attack!", this, LogLevel.warn, true)
      );
      return;
    }

    const newElement = {};
    newElement[this.bindLabel] = this.temporaryName;
    newElement[this.bindValue] = LeappSelectComponent.isFunction(this.defaultNewValue) ? this.defaultNewValue() : this.defaultNewValue;

    this.items.push(newElement);
    this.items = [...this.items];
    this.ngSelectComponent.select(newElement);
    this.selected.emit({ items: this.items, item: newElement });
  }

  change(): void {
    if (this.ngSelectComponent.selectedItems[0]?.selected) {
      // eslint-disable-next-line max-len
      this.selected.emit({
        items: this.items,
        item: { label: this.ngSelectComponent.selectedItems[0].label, value: this.ngSelectComponent.selectedItems[0].value[this.bindValue] },
      });
    } else {
      this.selected.emit({ items: this.items, item: null });
    }
  }

  selectValue(value: any): void {
    const found = this.items.findIndex((i) => i[this.bindValue] === value[this.bindValue]);
    if (found > -1) {
      this.ngSelectComponent.select(value);
      this.selected.emit({ items: this.items, item: value });
      console.log("leapp-select updated value: ", this.items, value);
    } else {
      console.log("leapp-select item not found in collection: ", this.items, value);
    }
  }

  setByEnter(): void {
    if (this.checkNewElement()) {
      this.addNewElement();
    }
  }

  reset(): void {}

  private checkCrossScriptingInjection(temporaryName: string): boolean {
    const sanitizedField = this.domSanitizer.sanitize(SecurityContext.URL, temporaryName);
    return sanitizedField.indexOf("unsafe:") > -1;
  }
}
