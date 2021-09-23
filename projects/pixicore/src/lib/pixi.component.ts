import {AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild} from "@angular/core";
import * as PIXI from 'pixi.js';
import {Application} from "@pixi/app";
import {PixiContainerElement} from "./elements/PixiContainerElement";
import {PixiSpriteElement} from "./elements/PixiSpriteElement";
import {PixiManager} from "./elements/PixiManager";
import {Tweener} from "./utils/tween";
import {AssetLoader} from "./utils/AssetRef";
import {PixiBlurFilterController} from "./elements/PixiController";
import {PixiApp} from "./elements/PixiData";
import {PixiButtonElement} from "./elements/PixiButtonElement";
import {PixiBitmapTextElement, PixiTextElement} from "./elements/PixiBitmapText";
import {PixiMeterElement} from "./elements/PixiMeterElement";
import { EventService } from "@sg/shared";
import { Subject } from "rxjs";

export declare var window: Window & { PIXI : any}

window.PIXI = PIXI;

@Component({
    selector: "pixi-game",
    template: `
      <canvas resizablediv [width]="data?.settings?.width?.toString() ?? '0'"
              [disableResizing]="disableResizing"
              [height]="data?.settings?.height?.toString() ?? '0'"
              #gameCanvas></canvas>
    `,
    styles: [
        `
            h1 {
                font-family: Lato;
            }
        `
    ]
})
export class PixiComponent implements AfterViewInit, OnDestroy {
    public boxSize: number = 3;
    private running = false;
    public manager: PixiManager | undefined;
    @Input() data: PixiApp | undefined;
    @Input() basePath: string = "./assets"
    @Input() disableResizing: boolean = false;
    private app: Application | undefined;

    managerReady = new Subject();
    onLoaded = new Subject();

    @ViewChild('gameCanvas') gameCanvas?: ElementRef<HTMLCanvasElement>;

    constructor(public elRef: ElementRef, private zone: NgZone, private eventSvc: EventService) {
        // The application will create a canvas element for you that you
        // can then insert into the DOM.
        PIXI.VERSION;
        console.log('Pixi COmponent created')
    }

    run() {
        this.running = true;
        this.tick(this.app);
    }

    pause() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    public ngAfterViewInit(): void {
        console.log('Pixi COmponent After View Init')
        const elements = [
            PixiSpriteElement,
            PixiContainerElement,
            PixiButtonElement,
            PixiBitmapTextElement,
            PixiMeterElement,
            PixiTextElement,
            PixiBlurFilterController,
        ]

        if (this.data) {
            this.zone.runOutsideAngular(() => this.createApp(this.data!));
        }
    }

    createApp(appData: PixiApp) {
        console.log('creating pixi app from base path: ', this.basePath)
        const app: Application = new Application({ ...appData.settings, view: this.gameCanvas?.nativeElement});
        const assetLoader = new AssetLoader(this.basePath);
        for (const text in appData.assets) {
            assetLoader.addFile(text, appData.assets[text]);
        }
        assetLoader.load(() => this.zone.runOutsideAngular(() => this.onAssetLoaded(app, appData, assetLoader)));
    }

    onAssetLoaded(app: Application, appData: PixiApp, assetLoader: AssetLoader) {
        this.running = true;
        this.elRef.nativeElement.appendChild(app.view);
        // console.log("Plugins", app.renderer.plugins);
        this.manager = new PixiManager(app);
        this.manager.addService(EventService, this.eventSvc);
        this.manager.addService(AssetLoader, assetLoader);
        this.managerReady.next();

        this.addServices(app);
        this.manager.init(appData.scene);
        app.stage.addChild(this.manager.view);
        this.tick(app);
        this.eventSvc.publish({type: 'gameLoaded'});
        this.onLoaded.next();
    }

    addServices(app: Application) {
        if (this.manager) {
            const tweener = new Tweener();
            this.manager.addService(Application, app);
            this.manager.addService(Tweener, tweener);
        }
    }

    private tick(app: Application | undefined) {
        if (app) {
            app.render();
            requestAnimationFrame(() => {
                if (this.running) {
                    app.render()
                }
            });
        }
    }

    ngOnDestroy() {
      this.manager?.destroy();
    }
}
