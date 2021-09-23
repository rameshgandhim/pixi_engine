import {Component, OnDestroy, OnInit} from '@angular/core';
import {EMPTY, interval, Observable, of, Subscription} from "rxjs";
import latestInspector$, {latestInstance$} from "../../services/latestInspector$";
import {map, merge, switchMap} from "rxjs/operators";
import AsyncInspector, {NodeType} from "../../services/AsyncInspector";
const POLL_INTERVAL = 56700; // Weird interval to be sure to be out of sync with a looping animation.
@Component({
  selector: 'pixi-detail-view',
  template: `
    <div class="detailview">
      <div *ngFor="let field of fields | async" class="detailview__item">
        <div class="detailview__label">
          {{field.path}}
        </div>
        <pixi-detail-value [field]="field" (propertyChange)="setProperty(field.path, $event)"></pixi-detail-value>
      </div>
    </div>
  `,
  styleUrls: ['./PixiDetailView.component.scss']
})
export class PixiDetailViewComponent implements OnInit, OnDestroy {
  fields: Observable<any>;
  inspector?: AsyncInspector | null;
  subscription?: Subscription;
  constructor() {
    this.fields = latestInspector$.pipe(
      switchMap((inspector) => {

        if (!inspector) {
          return EMPTY;
        }

        return interval(POLL_INTERVAL).pipe(
          merge(inspector.selected$),
          switchMap(() => {

            const props = inspector.getAllProperties()
            return of(props);
          }),
          map((fields: NodeType[]) => {
            const exists : {
              [key: string]: boolean
            } = {}
            return fields.reduce((acc: NodeType[], item: NodeType) => {
              if (exists[item.path!]) {
                return acc;
              }
              exists[item.path!] = true;
              return [...acc, item];
            }, []);
          })
        )
      })
    )
  }

  ngOnInit() {
    this.subscription = latestInspector$.subscribe(i => this.inspector = i);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  setProperty(path: string, event: any) {
    this.inspector?.setProperty(path, event)
  }
}

