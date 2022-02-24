import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NgSelectComponent} from '@ng-select/ng-select';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-leapp-select',
  templateUrl: './leapp-select.component.html',
  styleUrls: ['./leapp-select.component.scss']
})
export class LeappSelectComponent implements AfterViewInit {

  @ViewChild('ngSelectComponent')
  ngSelectComponent: NgSelectComponent;

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

  constructor() {
    this.temporaryName = '';
    this.uppercased = this.uppercased || true;
  }

  private static isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  }

  ngAfterViewInit(): void {
    this.ngSelectComponent.handleClearClick();
  }

  setTemporaryName($event: any) {
    this.temporaryName = $event.target.value;
  }

  checkNewElement(): boolean {
    return this.temporaryName !== '' && this.items.filter(s => s[this.bindLabel].indexOf(this.temporaryName) > -1).length === 0;
  }

  addNewElement(): void {
    const newElement = {};
    newElement[this.bindLabel] = this.temporaryName;
    newElement[this.bindValue] = LeappSelectComponent.isFunction(this.defaultNewValue) ? this.defaultNewValue() : this.defaultNewValue;

    this.items.push(newElement);
    this.items = [...this.items];
    this.ngSelectComponent.select(newElement);
    this.selected.emit({ items: this.items, item: newElement });
  }

  change() {
    if(this.ngSelectComponent.selectedItems[0]?.selected) {
      this.selected.emit({ items: this.items, item: { label: this.ngSelectComponent.selectedItems[0].label, value: this.ngSelectComponent.selectedItems[0].value[this.bindValue] }});
    } else {
      this.selected.emit({ items: this.items, item: null });
    }
  }

  reset() {}
}
