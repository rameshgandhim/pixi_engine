/**
 * Backend for the outliner / TreeView
 * - Performs selection / expand / collapse
 * - Detects changes in tree
 * - Serializes the tree for display in the outliner
 */
import { Container } from "@pixi/display";
import Inspector from "./Inspector";
import InspectorHighlight from "./InspectorHighlight";
import {NodeType} from "./AsyncInspector";

const outliner = Symbol("outliner");

declare var window: any;

export default class InspectorOutliner {
  root: any = {
    children: [],
    [outliner]: {
      id: 0,
      type: "root",
      collapsed: false,
      parent: null,
    },
  };
  // @todo garbage collect nodes
  nodes = [this.root];
  previousTree = {};
  previewSearth = "";

  constructor(private inspector: Inspector) {
    this.inspector = inspector;

    this.inspector.registerHook("beforeRender", c => this.detectScene(c));
    this.inspector.registerHook(
      "beforeRender",
      c => this.detectChanges(c),
      250
    );

    this.inspector.gui.rightclick$.subscribe(({ x, y }) => {
      const point = new inspector.instance.PIXI.Point(x, y);
      if (this.root.children.length) {
        for (let i = this.root.children.length - 1; i >= 0; i--) {
          const node = this.nodeAt(this.root.children[i], point);
          if (node) {
             window.$pixi = node;
            InspectorHighlight.node = node;
            this.inspector.emit("SELECTED", this.serialize(node));
            let parent = node;
            while (parent.parent) {
              parent = parent.parent;
              if (!parent[outliner]) {
                this.serialize(parent);
              }
              parent[outliner].collapsed = false; // expand to show the selection
            }
            this.inspector.emit("TREE", this.serialize(this.root));
            break;
          }
        }
      }
    });
  }

  select(id: number) {
    const node = this.nodes[id];
    if (node) {
      window.$pixi = node;
      InspectorHighlight.node = node;
      return node;
    }
    return null;
  }

  selected() {
    if (window.$pixi) {
      const id = window.$pixi[outliner].id;
      if (this.nodes[id] && this.nodes[id] === window.$pixi) {
        return this.serialize(this.nodes[id]);
      }
    }
    return false;
  }

  tree() {
    const result = this.serialize(this.root);
    console.log('getting tre', result)
    return result;
  }

  expand(id: number) {
    const node = this.nodes[id];
    if (node) {
      node[outliner].collapsed = false;
      return this.serialize(node).children;
    }
  }
  collapse(id: number) {
    const node = this.nodes[id];
    if (node) {
      node[outliner].collapsed = true;
      return this.serialize(node).children;
    }
  }
  searchFilter(search: string): NodeType {
    if (search) {
      for (const node of this.nodes) {
        node[outliner].found =
          node[outliner].name &&
          node[outliner].name.toLowerCase().includes(search.toLowerCase());
        node[outliner].found && this.extendAllParents(node);
      }
    } else {
      for (const node of this.nodes) {
        node[outliner].found = false;
      }
    }
    return this.serialize(this.root).children;
  }

  extendAllParents(node: any) {
    for (const nodeF of this.nodes) {
      if (node[outliner].parent === nodeF[outliner].id) {
        nodeF[outliner].collapsed = false;
        this.extendAllParents(nodeF);
      }
    }
  }

  highlight(id: number) {
    const node = this.nodes[id];
    if (node) {
      InspectorHighlight.node = node;
    } else {
      InspectorHighlight.node = false;
    }
  }

  detectScene(container: Container) {
    if (this.root.children.indexOf(container) === -1) {
      // container was rendered for the first time?
      this.root.children.push(container);
      this.serialize(container);
      (container as any)[outliner].collapsed = false; // Auto expand root level
      this.inspector.emit("TREE", this.serialize(this.root));
      if (!window.$pixi) {
        window.$pixi = container; // autoselect if nothing is selected
        this.inspector.emit("SELECTED", this.serialize(container));
      }
    }
  }

  detectChanges(container: any) {
    if (container[outliner]) {
      const id = container[outliner].id;
      if (hasChanged(container, (this.previousTree as any)[id])) {
        this.serialize(container);
        this.inspector.emit("TREE", this.root[outliner]);
        (this.previousTree as any)[id] = container[outliner];
      }
    }
    // container[meta].lastRender = Date.now()
  }

  nodeAt(node: any, point: any): any {
    if (node.visible === false) {
      // || node.renderable === false
      return false;
    }
    if (node.children && node.children.length) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const found = this.nodeAt(node.children[i], point);
        if (found) {
          return found;
        }
      }
    }
    if (node.containsPoint) {
      if (node.containsPoint(point)) {
        return node;
      }
    } else if (node.getBounds && node.getBounds().contains(point.x, point.y)) {
      return node;
    }
    return false;
  }

  serialize(node: any) {
    if (typeof node[outliner] === "undefined") {
      node[outliner] = {
        id: -1,
        name: node.name,
        type: this.inspector.typeDetection.detectType(node),
        collapsed:
          node.parent && node.parent[outliner]
            ? node.parent[outliner].parent !== null
            : false,
        children: null,
      };
      node[outliner].id = this.nodes.push(node) - 1;
    }
    if (node.parent && node.parent[outliner]) {
      node[outliner].parent = node.parent[outliner].id;
    } else {
      node[outliner].parent = null;
    }

    if (Array.isArray(node.children)) {
      if (node.children.length === 0) {
        node[outliner].children = false;
      } else if (
        node[outliner].collapsed === false ||
        (node[outliner].parent && !node[outliner].parent.found)
      ) {
        node[outliner].children = node.children.map((childNode: any) =>
          this.serialize(childNode)
        );
      } else {
        node[outliner].children = true;
      }
    } else {
      node[outliner].children = false;
    }
    return node[outliner];
  }
}

function hasChanged(node: any, serialized: any) {
  if (!serialized) {
    // detect addition
    return true;
  }
  if (!node[outliner]) {
    // not serialized before
    return true;
  }
  if (node[outliner].id !== serialized.id) {
    // detect order change
    return true;
  }
  if (!serialized.collapsed) {
    const length = node.children.length;
    if (typeof serialized.children === 'boolean') {
      if (length !== 0 !== serialized.children) {
        return true;
      }
    } else {
      if (length !== serialized.children.length) {
        // detect child removal/addition
        return true;
      }
    }
    for (let i = 0; i < length; i++) {
      if (hasChanged(node.children[i], serialized.children[i])) {
        // detect nested change
        return true;
      }
    }
  } else if (Array.isArray(node.children)) {
    if (node.children.length > 0 && node.children.length !== serialized.children.length) {
      // detect 1+ to 0 and 0 to 1+ children
      return true;
    }
  } else if (serialized.children === true) {
    // detect child removal
    return true;
  }
  return false;
}
