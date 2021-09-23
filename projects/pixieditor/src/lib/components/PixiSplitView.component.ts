import {Component, ContentChildren, Directive, QueryList, ViewChildren} from '@angular/core';
import {Content} from "@angular/compiler/src/render3/r3_ast";

@Directive({selector: '[split-pane]'})
export class SplitPaneDirective {
}

@Component({
  selector: 'pixi-splitview',
  template: `
    <div class="splitview">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .splitview {
      display: flex;

      ::slotted(*) {
        flex: 1;
        overflow: auto;
        // max-height: 100 %;

        &:not(:first-child) {
          border-left: 1px solid #ccc;
        }

      }
    }

    .splitview__item {
      flex: 1;
      overflow: auto;
      // max-height: 100 %;

    &:not(:first-child) {
      border-left: 1px solid #ccc;
    }

    }
  `]
})
export class PixiSplitViewComponent {
  @ContentChildren(SplitPaneDirective) items!: QueryList<SplitPaneDirective>;
}

