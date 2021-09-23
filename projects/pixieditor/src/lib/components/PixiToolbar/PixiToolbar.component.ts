import { Component } from '@angular/core';
import {Subscription} from "rxjs";

@Component({
  selector: 'pixi-toolbar',
  template: `
    <div class="toolbar">
        <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .toolbar {
      border-bottom: 1px solid #dadada;
      color: #5a5a5a;
      padding: 3px 5px;
    }
  `]
})
export class PixiToolbarComponent {
}
