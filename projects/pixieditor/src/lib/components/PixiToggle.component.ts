import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'pixi-toggle',
  template: `
    <span [ngClass]="{
    'toggle': true,
    'toggle--on': value,
    'toggle--off': !value
    }"
          (click)="change.emit(!value)"
    >
    </span>
  `,
  styles: [`
    .toggle {
      display: inline-block;
      padding: 2px;
    }

    .toggle__icon {
      display: inline-block;
      width: 16px;
      height: 16px;
      -webkit-mask-size: 16px 16px;
    .toggle--on & {
      background: rgb(66, 129, 235);
    }
    .toggle--off & {
      background: #5a5a5a;
    }
    }

    .toggle__icon--node-search {
      /*-webkit-mask-image: url(../../img/select-to-inspect.png);*/
    }
  `]
})
export class PixiToggleComponent {
  @Input()
  value: boolean = false;

  @Output()
  change: EventEmitter<boolean> = new EventEmitter<boolean>()
}

