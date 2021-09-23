import {Component} from '@angular/core';
import {Observable, Subscription} from "rxjs";
import latestInspector$ from "../services/latestInspector$";
import {map} from "rxjs/operators";
import Inspector from "../services/Inspector";
import AsyncInspector from "../services/AsyncInspector";
import connection from "../services/connection";

@Component({
  selector: 'pixi-panel',
  template: `
    <div class="pixi-panel">

      <pixi-toolbar>
        <button (click)="reload()">Reconnect</button>
        <input
          class="pixi-panel__search"
          type="search"
          [(ngModel)]="search"
          placeholder="Find by name"
          (keyup.enter)="searchFilter(search)"
        >
      </pixi-toolbar>
      <pixi-splitview *ngIf="injected$ | async" class="pixi-panel__body">
        <pixi-treeview style="flex: 1;
      overflow: auto;" split-pane></pixi-treeview>
        <pixi-detail-view style="flex: 1;
      overflow: auto;" split-pane></pixi-detail-view>
      </pixi-splitview>
      <div *ngIf="!(injected$ | async) && messageVisible" class="pixi-panel__message">
        Looking for
        <span class="pixi-panel__inline-logo">pixijs</span>
      </div>
    </div>
  `,
  styleUrls: ['./PixiPanel.component.scss']
})
export class PixiPanelComponent {
  selectModeSubscription: Subscription | undefined;
  injected$: Observable<boolean> = latestInspector$.pipe(map((inspector) => inspector !== null));
  search = ""
  inspector: AsyncInspector | undefined;
  messageVisible = true;

  constructor() {
    latestInspector$.subscribe(i => {
      console.log('inspector change : ', i)
      this.inspector = i as AsyncInspector}
    )
  }
  // todo-fix
  //
  // toggleSelectMode(value) {
  //   this.selectModeSubscription = this.inspector$
  //     .first()
  //     .subscribe((inspector) => {
  //       inspector.selectMode(value);
  //     });
  // }
  searchFilter(s: string) {
    this.inspector?.searchFilter(s)
  }
  reload() {
    window.location.reload();
  }

  //
  // get darkMode() {
  //   return (
  //     typeof chrome !== "undefined" &&
  //     typeof chrome.devtools !== "undefined" &&
  //     typeof chrome.devtools.panels !== "undefined" &&
  //     chrome.devtools.panels.themeName === "dark"
  //   );
  // }

  detect() {
    connection.to("content_scripts").send("DETECT");
  }
}
