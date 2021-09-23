import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BehaviorSubject} from "rxjs";

export type Field = {
  type: Object,
  required: boolean,
  value?: any
}

@Component({
  selector: 'pixi-detail-value',
  template: `
    <span>
      <span
        *ngIf="field.type === 'number' || field.type === 'string'"
        class="detailvalue__input"
        contenteditable="true"
        (focus)="onFocus()"
        (blur)="onBlur($event)"
        (keydown)="keydown($event)"
        [innerHTML]="fieldValue$ | async"
      ></span>
      <label *ngIf="field.type ==='boolean'" class="detailvalue__label">
        <input [(ngModel)]="field.value" type="checkbox" (change)="toggle()"> {{field.value}}
      </label>
        <span>{{ type() }}</span>
    </span>
  `,
  styles: [`
    .detailvalue__input {
      border: none;
      min-width: 50px;
      display: block;
    }
    .detailvalue__label {
      position: relative;
      padding-left: 12px;
    }
    .detailvalue__label input {
      position: absolute;
      top: -2px;
      left: -6px;
    }
  `]
})
export class PixiDetailValueComponent {
  _field: Field = {
    type: Object,
    required: true
  }

  isEdit = false;

  fieldValue$ = new BehaviorSubject(null);

  get fieldValue() {
    return this.fieldValue$.getValue();
  }

  @Input()
  set fieldValue(val: any) {
    this.fieldValue$.next(val)
  }

  @Input()
  set field(value: Field) {
    this._field = value;
    if (!this.isEdit) {
      this.fieldValue$.next(this._field.value)
    }
  }

  @Output() propertyChange: EventEmitter<any> = new EventEmitter<any>();
  get field() {
    return this._field;
  }

  onFocus() {
    this.isEdit = true;
    if (this.isEdit && this.fieldValue === undefined) {
      this.fieldValue$.next(this._field.value)
    }
  }

  onBlur(e: any) {
    const oldValue = this.fieldValue;
    this.fieldValue = e.target.innerText;
    this.isEdit = false;
    if (oldValue !== this.fieldValue) {
      this.sentNewValue(this.fieldValue);
    }
  }

  type() {
    const type = this.field.type;
    if (type === "object" && this.field.value === null) {
      return "null";
    }
    if (type === "boolean" || type === "number" || type === "string") {
      return "";
    }
    return type;
  }

  toggle() {
    this.sentNewValue(this.field.value);
  }

  keydown(e: any) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.sentNewValue(e.target.innerText);
    } else if (this.field.type !== "number") {
      return;
    }
    let value = parseFloat(e.target.innerText);
    let update = false;
    let size = 1;
    if (e.altKey) {
      size = 0.1;
    } else if (e.shiftKey) {
      size = 10;
    }
    switch (e.key) {
      case "ArrowUp":
        update = !isNaN(value);
        value += size;
        break;
      case "ArrowDown":
        update = !isNaN(value);
        value -= size;
        break;
    }
    if (update) {
      e.target.innerText = value;
      this.sentNewValue(value);
    }

  }

  sentNewValue(value: any) {
    let newValue;
    const isNumber = parseFloat(value);
    const isNullOrNaN =
      typeof value === "string"
        ? value.match(/^(\\null|\\NaN|\\undefined)$/)
        : false;
    if (!isNaN(isNumber)) {
      // is number
      newValue = isNumber;
    } else if (isNullOrNaN) {
      // is null or NaN or undefined sent not like string
      switch (value) {
        case "\\null":
          newValue = null;
          break;
        case "\\NaN":
          newValue = NaN;
          break;
        case "\\undefined":
          newValue = undefined;
          break;
      }
    } else {
      // is just string
      newValue = value;
    }
    this.fieldValue = newValue;
    this.propertyChange.emit(newValue);
  }
}

