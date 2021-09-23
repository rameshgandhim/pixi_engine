import { Renderer } from "@pixi/core";
import { Container } from "@pixi/display";
import { Subject, ReplaySubject, fromEvent, merge, empty, Subscription } from "rxjs";
import {
  map,
  distinctUntilChanged,
  shareReplay,
  withLatestFrom,
  tap,
  switchMap,
  debounceTime,
  combineLatest,
} from "rxjs/operators";
import { Type } from "@pixicore";
import Inspector from "./Inspector";

interface IOverlay {
  div: HTMLDivElement | null,
  renderer: any
  PIXI: any
  Stage: Type<unknown> | null
}

export const overlay : IOverlay = {
  div: null,
  renderer: null,
  PIXI: null,
  Stage: null
};

export interface PointerCoordinates
{
  x: number,
  y: number,
  event?: Event
}

export default class InspectorGui {
  stage: any;
  rightclick$: Subject<PointerCoordinates> = new Subject();
  renderer: Renderer | undefined;
  renderer$: ReplaySubject<Renderer> = new ReplaySubject(1);
  container: Container;
  offset = {
    canvas: { x: 0, y: 0 },
    iframe: { x: 0, y: 0 },
  };
  size = {
    canvas: { width: 800, y: 600, height: 0, x: 0 },
    renderer: { width: 800, y: 600, height: 0, x: 0 },
  };
  subscription: Subscription;

  constructor(inspector: Inspector) {
    if (!overlay.PIXI) {
      this.initOverlay(inspector);
    }
    if (overlay.Stage) {
      this.stage = new overlay.Stage();
    }
    if (
      overlay.Stage !==
      (overlay.PIXI.Container || overlay.PIXI.DisplayObjectContainer)
    ) {
      this.container = new overlay.PIXI.DisplayObjectContainer();
      this.stage.addChild(this.container);
    } else {
      this.container = this.stage;
    }
    inspector.registerHook(
      "beforeRender",
      (_, r) => this.updateRenderer(r),
      5000
    );
    inspector.registerHook("beforeRender", this.render.bind(this));
    
    const canvas$ = this.renderer$.pipe(
      map((renderer) => renderer.view),
      distinctUntilChanged()
    );

    const iframe$ = canvas$.pipe(
      map((reference) => {
        const divCanvas = document.querySelectorAll("canvas")
        for (let i = 0; i < divCanvas.length; ++i) {
          const canvas = divCanvas[i]
          if (canvas === reference) {
            return null; // canvas found in current frame
          }
        }
        const divIFrame = document.querySelectorAll("iframe");
        for (let i = 0; i < divIFrame.length; ++i) {
          const iframe = divIFrame[i]
          try {
            const canvasDivs = iframe.contentDocument?.querySelectorAll(
              "canvas"
            )
            if (canvasDivs) {
              for (let j = 0; j < canvasDivs?.length; ++j) {
                const canvas = canvasDivs[j]
                if (canvas === reference) {
                  return iframe;
                }
              }
            }
          } catch (err) {
            // ignore cors errors
          }
        }
        return null;
      }),
      shareReplay(1)
    );

    const handleClick$ = canvas$.pipe(
      switchMap((canvas: HTMLCanvasElement) =>
        merge(
          fromEvent(canvas, "contextmenu").pipe(
            tap((event) => {
              event.preventDefault();
            })
          ),
          fromEvent(canvas, "pointerdown", { capture: true }).pipe(
            withLatestFrom(iframe$, this.renderer$),
            tap(([event, iframe, renderer]) => {
              const mobSelectKey =
                (event as PointerEvent).pointerType === "touch" && (event as KeyboardEvent).altKey;

              if (event instanceof MouseEvent && event.which === 3 || mobSelectKey) {
                this.calculateOffset(canvas, iframe);
                const scale = {
                  x: this.resolution.x / renderer.resolution,
                  y: this.resolution.y / renderer.resolution,
                };
                const x = ((event as any).clientX - this.offset.canvas.x) * scale.x;
                const y = ((event as any).clientY - this.offset.canvas.y) * scale.y;
                this.rightclick$.next({ x, y, event });
              }
            })
          )
        )
      )
    );

    const handleResize$ = fromEvent(window, "resize").pipe(
      debounceTime(100),
      tap(() => {
        overlay.renderer.resize(window.innerWidth, window.innerHeight);
        overlay.renderer.view.style.width = window.innerWidth + "px";
        overlay.renderer.view.style.height = window.innerHeight + "px";
      }),
      switchMap(() =>
        iframe$.pipe(
          combineLatest(canvas$),
          tap(([iframe, canvas]) => {
            this.calculateOffset(canvas, iframe);
          })
        )
      )
    );

    const handleScroll$ = iframe$.pipe(
      combineLatest(canvas$),
      switchMap(([iframe, canvas]) => {
        const elements: Window[] = [window]
          .concat(parentElements(iframe))
          .concat(parentElements(canvas));
        if (iframe) {
          elements.push(iframe.contentWindow!);
        }
        return merge(
          ...elements.map((element) => fromEvent(element, "scroll"))
        ).pipe(
          debounceTime(50),
          tap(() => {
            this.calculateOffset(canvas, iframe);
          })
        );
      })
    );

    this.subscription = inspector.enabled$
      .pipe(
        tap((enabled) => {
          if (enabled) {
            overlay.div?.removeAttribute("style");
          } else {
            overlay.div?.removeAttribute("style");
          }
        }),
        switchMap((enabled) => {
          if (enabled === false) {
            return empty();
          }
          return merge(
            handleResize$,
            handleScroll$,
            handleClick$,
            canvas$.pipe(
              combineLatest(iframe$),
              tap(([canvas, iframe]) => {
                this.calculateOffset(canvas, iframe);
              })
            )
          );
        })
      )
      .subscribe();
  }

  get resolution() {
    return {
      x: this.size.renderer.width / this.size.canvas.width,
      y: this.size.renderer.height / this.size.canvas.height,
    };
  }

  /*eslint-disable class-methods-use-this */
  initOverlay(inspector: Inspector) {
    overlay.PIXI = inspector.instance.PIXI;
    overlay.Stage =
      overlay.PIXI.Container ||
      overlay.PIXI.Stage ||
      overlay.PIXI.DisplayObjectContainer;
    overlay.div = document.createElement("div");
    overlay.div.id = "pixi-inspector-overlay";
    const style = document.createElement("style");
    style.textContent = `
      #pixi-inspector-overlay {
        position: fixed;
        z-index: 16000000;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        overflow: hidden;
      }
      #pixi-inspector-overlay canvas {
        position: absolute;
        top: 0;
        left: 0;
      }
      `;
    overlay.div.appendChild(style);
    document.body.appendChild(overlay.div);

    const canvas = document.createElement("canvas");
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const options = {
      transparent: true,
      resolution: window.devicePixelRatio,
      view: canvas,
    };
    let overlayRendererType;
    if (typeof overlay.PIXI.Renderer !== "undefined") {
      overlayRendererType = overlay.PIXI.Renderer;
    } else {
      overlayRendererType = overlay.PIXI.WebGLRenderer;
    }
    if (overlayRendererType.length === 1) {
      // Expects a Phaser Game object?
      overlay.renderer = new overlayRendererType(
        Object.assign(
          {
            canvas,
            camera: {
              _shake: { x: 0, y: 0 },
            },
            width: window.innerWidth,
            height: window.innerHeight,
          },
          options
        )
      );
    } else {
      overlay.renderer = new overlayRendererType(
        window.innerWidth,
        window.innerHeight,
        options
      );
    }
    overlay.div.appendChild(canvas);
  }

  render() {
    if (overlay.renderer) {
      overlay.renderer.render(this.stage);
    }
  }

  updateRenderer(renderer: Renderer) {
    this.renderer = renderer;
    this.renderer$.next(renderer);
  }

  calculateOffset(canvas: HTMLCanvasElement, iframe: HTMLIFrameElement | null) {
    const bounds = canvas.getBoundingClientRect();
    this.offset.canvas.x = bounds.left;
    this.offset.canvas.y = bounds.top;
    this.size.canvas.width = bounds.width;
    this.size.canvas.height = bounds.height;
    this.size.renderer.width = this.renderer?.width ?? 0;
    this.size.renderer.height = this.renderer?.height ?? 0;

    if (iframe) {
      const iframeBounds = iframe.getBoundingClientRect();
      this.offset.iframe.x = iframeBounds.left;
      this.offset.iframe.y = iframeBounds.top;
    } else {
      this.offset.iframe.x = 0;
      this.offset.iframe.y = 0;
    }
    this.container.position.x = this.offset.iframe.x + this.offset.canvas.x;
    this.container.position.y = this.offset.iframe.y + this.offset.canvas.y;
  }
}

function parentElements(element: any) {
  if (element === null) {
    return [];
  }
  const elements = [];
  while (element.parentElement) {
    elements.push(element.parentElement);
    element = element.parentElement;
  }
  return elements;
}
