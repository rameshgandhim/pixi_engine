import {Subject, defer, concat, merge as mergeObservables, Observable, of} from "rxjs";
import {tap, merge, publishReplay, refCount, map} from "rxjs/operators";
import connection from "./connection";
import Inspector from "./Inspector";

export type NodeType = {
  id: number,
  children?: NodeType[] | boolean,
  type?: string | null,
  name?: string | null,
  collapsed?: boolean,
  path?: string;
  parent?: NodeType
};
declare var chrome: any;
/**
 * Async access to the Inspector.
 *
 *
 * All operations return Promises
 */
export default class AsyncInspector {
  private inspector: Inspector | undefined;
  private path: string | undefined;
  private target?: any;
  local = {
    selected$: new Subject(),
    treeChange$: new Subject(),
  };
  tree$: Observable<any>;
  selected$: Observable<any>;

  constructor(index: Inspector | string, target: any) {
    if (index instanceof Inspector) {
      this.inspector = index;
    } else {
      this.path = "__PIXI_INSPECTOR_GLOBAL_HOOK__.inspectors[" + index + "]";
      this.target = target;
    }
    this.tree$ = defer(() => {
      console.log('tree --> defer')
      let root: any = null;
      return concat(
        of(this.inspector?.outliner.tree()),
        connection!.on("TREE")!
          .pipe(
            map((message) => message.data))
      ).pipe(
        tap((tree) => {
          if (tree) {
            root = tree;
          }
        }),
        merge(this.local.treeChange$.pipe(map(() => root)))
      );
    }).pipe(publishReplay(1), refCount());

    this.selected$ = mergeObservables(
      defer(() => of(this.inspector?.outliner.selected())),
      connection.on("SELECTED").pipe(map((message) => message.data)),
      this.local.selected$
    );
  }

  enable() {
    return this.inspector?.enable();
  }

  disable() {
    this.inspector?.disable();
  }

  expand(node: NodeType) {
    const children = this.inspector?.outliner.expand(node.id);
    node.collapsed = false;
    node.children = children;
    this.local.treeChange$.next(node);
  }

  collapse(node: NodeType) {
    const children = this.inspector?.outliner.collapse(node.id);
    node.collapsed = true;
    node.children = children;
    this.local.treeChange$.next(node);
  }

  toggle(node: NodeType) {
    if (node.collapsed) {
      return this.expand(node);
    }
    return this.collapse(node);
  }

  searchFilter(search: string) {
    const result = this.inspector?.outliner.searchFilter(search);
    this.local.treeChange$.next(result);
  }

  select(node: NodeType) {
    const result = this.inspector?.outliner.select(node.id);
    this.local.selected$.next(node);
  }

  setProperty(path: string, value: any) {
    return this.inspector?.properties.set(path, value);
  }

  highlight(node: NodeType | null) {
    return this.inspector?.outliner.highlight(node?.id ?? -1);
  }

  getAllProperties(): NodeType[]{
    return this.inspector?.properties.all() || [];
  }
}
