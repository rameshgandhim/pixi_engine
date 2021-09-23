import {Component, Input} from '@angular/core';
import latestInspector$ from "../services/latestInspector$";
import {filter, map, switchMap} from "rxjs/operators";
import {EMPTY, Observable, of} from "rxjs";
import AsyncInspector, {NodeType} from "../services/AsyncInspector";

@Component({
  selector: 'pixi-treeview',
  template: `
    <div class="treeview"
        tabindex="1"
      (keydown.arrowRight)="navigateRight($event)"
         (keydown.arrowLeft)="navigateLeft($event)"
         (keydown.arrowUp)="navigateUp($event)"
         (keydown.arrowDown)="navigateDown($event)"
      >

      <div
        *ngFor="let row of rows$ | async"
        [ngClass]="{
            'treeview__item' : true,
            'treeview__item--selected': selected && row.node.id === selected.id,
            'treeview__item--found': row.node.found
        }"
        (mousedown)="select(row.node)"
        (mouseenter)="highlight(row.node)"
        (click)="toggle(row.node)"
        (mouseleave)="highlight(null)"
      >
        <div [style.width]="row.indent * 14 + 'px'"
        class="treeview__indent"></div>
          <div class="treeview__toggle">
            <div
              *ngIf="row.node.children && row.node.collapsed"
              class="treeview__toggle__expand"
              (click)="expand(row.node)"
            >
            </div>
            <div
              *ngIf="row.node.children && !row.node.collapsed"
              class="treeview__toggle__collapse"
              (click)="collapse(row.node)"
            ></div>
          </div>
          <div class="treeview__label">
            {{ row.title }}
          </div>
      </div>
    </div>
  `,
  styleUrls: ['./PixiTreeView.component.scss']
})
export class PixiTreeViewComponent {
  @Input() search: string = "";
  inspector$: Observable<AsyncInspector | null> = latestInspector$.pipe(
    filter((inspector) => inspector !== null)
  )
  inspector?: AsyncInspector | null;
  selected$: Observable<boolean>;
  selected?: any;
  rows?: any[];
  rows$: Observable<any[]>;
  constructor() {
    this.selected$ = this.inspector$.pipe(switchMap((inspector) => inspector?.selected$ ?? of({})))
    this.rows$ = this.inspector$.pipe(
      switchMap(i => i?.tree$ ?? EMPTY),
      map(t => this.flattenTree(t))
    )
    this.rows$.subscribe(r => this.rows = r)
    this.selected$.subscribe(s => {
      console.log('selected', s)
      this.selected = s
    });
    this.inspector$.subscribe(s => this.inspector = s)
  }

  flattenTree(tree: NodeType) {
    const rows: any[] = [];
    if (tree && Array.isArray(tree.children)) {
      for (const node of tree.children) {
        this.flattenNode(node, rows, 0);
      }
    }
    return rows;
  }

  flattenNode(node: NodeType, rows: any[], indent = 0) {
    let title = node.type;
    if (
      typeof node.name !== "undefined" &&
      node.name !== null &&
      node.name !== ""
    ) {
      title = node.type + " [" + node.name + "]";
    }
    rows.push({indent, node, title});
    indent++;
    if (!node.collapsed && node.children) {
      if (Array.isArray(node.children)) {
        for (const subnode of node.children) {
          this.flattenNode(subnode, rows, indent);
        }
      }
    }
  }

  navigateUp(event: Event) {
    event?.preventDefault()
    const index = this.findRowIndex(this.selected.id);
    if (index > 0 && this.rows) {
      this.select(this.rows[index - 1].node);
    }
  }

  select(node: NodeType) {
    this.inspector?.select(node)
  }

  expand(node: NodeType) {
    this.inspector?.expand(node)
  }

  toggle(node: NodeType) {
    this.inspector?.toggle(node)
  }

  collapse(node: NodeType) {
    this.inspector?.collapse(node)
  }

  highlight(node: NodeType | null) {
    this.inspector?.highlight(node ?? null)
  }

  navigateRight(event: Event) {
    event?.preventDefault()
    if (!this.rows) {
      return;
    }
    const index = this.findRowIndex(this.selected.id);
    const row = this.rows[index];
    if (row.node.collapsed) {
      this.expand(row.node);
    } else if (index < this.rows.length - 1) {
      this.select(this.rows[index + 1].node);
    }
  }

  navigateDown(event: Event) {
    event?.preventDefault()
    if (!this.rows) {
      return;
    }
    const index = this.findRowIndex(this.selected.id);
    if (index < this.rows.length - 1) {
      this.select(this.rows[index + 1].node);
    }
  }

  navigateLeft(event: Event) {
    event?.preventDefault()
    if (!this.rows) {
      return;
    }
    const index = this.findRowIndex(this.selected.id);
    const row = this.rows[index];
    if (!row.node.collapsed) {
      this.collapse(row.node);
    } else if (index > 0) {
      const parentIndex = this.findRowIndex(row.node.parent);
      this.select(this.rows[parentIndex].node);
    }
  }

  findRowIndex(id: number) {
    if (this.rows) {
      for (const i in this.rows) {
        if (this.rows[i].node.id === id) {
          return parseInt(i);
        }
      }
    }
    return -1;
  }
}

