import { ReplaySubject } from "rxjs";
import TypeDetection from "./TypeDetection";
import runHooks from "./runHooks";
import { EmitFn, PixiInstanceType } from "./devconnection";
import { Container } from "@pixi/display";
import { Renderer } from "@pixi/core";
import InspectorGui from "./InspectorGui";
import InspectorOutliner from "./InspectorOutliner";
import InspectorProperties from "./InspectorProperties";
import InspectorHighlight from "./InspectorHighlight";

export type IHook = {
  callback: any,
  throttle: number,
  skip: boolean,
};

export type Hooks = {
  beforeRender: IHook[]
  afterRender: IHook[]
}

export type HookType = keyof Hooks;

export type HookCallbackType = (c: Container, r: Renderer) => void;

export type RendererType = "CanvasRenderer" | "Renderer" | "WebGLRenderer";

export default class Inspector {
  unpatched: Partial<Record<RendererType, Renderer>> = {};
  hooks: Hooks = {
    beforeRender: [],
    afterRender: [],
  };
  enabled$: ReplaySubject<boolean> = new ReplaySubject(1);
  typeDetection = new TypeDetection();
  outliner: InspectorOutliner;
  gui: InspectorGui
  properties: InspectorProperties;
  highlight: InspectorHighlight;

  constructor(public instance: PixiInstanceType, public emit: EmitFn) {

    // Register types

    const console = window.console;
    (window as any).console = {
      warn() {
        // Prevent lots of "Deprecation Warning: PIXI.${oldthing} has been deprecated, please use PIXI.${newthing}"
      },
    };
    this.typeDetection.registerTypes("PIXI.", instance.PIXI, 2);
    instance.Phaser &&
      this.typeDetection.registerTypes("Phaser.", instance.Phaser);
    window.console = console;

    // Register "plugins"
    this.gui = new InspectorGui(this);
    this.outliner = new InspectorOutliner(this);
    this.properties = new InspectorProperties(this);
    this.highlight = new InspectorHighlight(this);
  }

  enable() {
    if (!this.unpatched.CanvasRenderer) {
      this.patch("CanvasRenderer");
    }
    if (typeof this.instance.PIXI.Renderer !== "undefined") {
      if (!this.unpatched.Renderer) {
        this.patch("Renderer");
      }
    } else if (!this.unpatched.WebGLRenderer) {
      this.patch("WebGLRenderer");
    }
    this.enabled$.next(true);
  }

  disable() {
    for (const [renderer, renderMethod] of Object.entries(this.unpatched)) {
      this.instance.PIXI[renderer].prototype.render = renderMethod;
    }
    this.unpatched = {};
    this.enabled$.next(false);
  }

  /**
   * Patch the Renderer.render method to get a hold of the stage object(s)
   */
  patch(renderer: RendererType) {
    if (this.unpatched[renderer]) {
      /* eslint-disable no-console */
      console.warn(renderer + " already patched");
      /* eslint-enable */
      return;
    }
    const Renderer = this.instance.PIXI[renderer];
    if (Renderer && Renderer.prototype.render) {
      const renderMethod = Renderer.prototype.render;
      this.unpatched[renderer] = renderMethod;
      const self = this;
      Renderer.prototype.render = function (container: Container, ...args: any) {
        runHooks(self.hooks.beforeRender, container, this);
        const result = renderMethod.apply(this, [container, ...args]);
        runHooks(self.hooks.afterRender, container, this);
        return result;
      };
    }
  }

  /**
   * @param {string} type 'beforeRender', 'afterRender'
   * @param {Function} callback
   * @param {number} ms
   * @return {Function} unregister
   */
  registerHook(type: HookType, callback: HookCallbackType, ms = 0) {
    const hook = {
      callback,
      throttle: ms,
      skip: false,
    };
    this.hooks[type].push(hook);
    return () => {
      const index = this.hooks[type].indexOf(hook);
      if (index !== -1) {
        this.hooks[type].splice(index, 1);
      }
    };
  }
}
