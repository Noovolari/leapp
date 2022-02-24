import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {FormGroup} from '@angular/forms';

@Component({
  selector: 'app-filter-menu',
  templateUrl: './filter-menu.component.html',
  styleUrls: ['./filter-menu.component.scss']
})
export class FilterMenuComponent implements OnInit {

  @ViewChild(MatMenuTrigger)
  trigger: MatMenuTrigger;

  @Input()
  callback: any;

  @Input()
  name: string;

  @Input()
  icon: string;

  @Input()
  data: { id?: string; category?: string; name: string; value: boolean; show?: boolean }[];

  @Input()
  form: FormGroup;

  @Input()
  control: string;

  @Input()
  searchable: boolean;

  @Input()
  categories: string[];

  constructor() {
    this.searchable = false;
  }

  ngOnInit(): void {
    this.data = this.data.map(o => {
      o.show = true;
      return o;
    });
  }

  updateValue(event: any, data: { id?: string; category?: string; name: string; value: boolean; show?: boolean }[], form: FormGroup) {
    data = data.map(o => ({ id: o.id, name: o.name, value: o.value, category: o.category }));
    form.get(this.control).setValue(data);
  }

  searchContent(event: any) {
    this.data = this.data.map(o => {
      o.show = (o.name.toLowerCase().indexOf(event.target.value) > -1);
      return o;
    });
  }

  applyCallback(event: MouseEvent, data: { id?: string; category?: string; name: string; value: boolean; show?: boolean }[], form: FormGroup) {
    if(this.callback) {
      this.callback(event, data, form);
    }
  }

  dataActive() {
    return this.data.filter(d => d.value).length > 0;
  }

  dataLabel() {
    const result = this.data.filter(d => d.value).map(d => d.name);
    return result.length > 0 ? (result.length > 2 ? `${this.name} · ${result.length}`: result.join(', ')) : this.name;
  }

  resetData(event, form: FormGroup) {
    event.preventDefault();
    event.stopPropagation();

    this.data = this.data.map(d => {
      d.value = false;
      return d;
    });
    form.get(this.control).setValue(this.data);
  }
}
