import { DisplayObject } from "@pixi/display";
import { BlurFilter } from '@pixi/filter-blur'
import { Graphics } from "@pixi/graphics";
import { Sprite } from "pixi.js";
import {IDestroy, IPixi, IPostInitialize} from "./IPixiUpdate";
import { Inject, PixiElement } from "./PixiElement";
import {PixiContainerElement} from "./PixiContainerElement";
import {Observable, PartialObserver, Subscription} from "rxjs";


export abstract class PixiController implements IPixi, IDestroy {

    @Inject()
    parent: IPixi | undefined;
    private rootSubscription: Subscription = new Subscription();

    protected subscribe<T>(
        observable: Observable<T>,
        observerOrNext?: PartialObserver<T> | ((value: T) => void),
        error?: (error: any) => void,
        complete?: () => void
    ): Subscription {
        return this.rootSubscription.add(
            observable.subscribe(observerOrNext as any, error, complete)
        );
    }

    protected unsubscribe(sub: Subscription): void {
        this.rootSubscription.remove(sub);
    }

    destroy(): void {
        this.rootSubscription?.unsubscribe();
    }
}

export interface PixiController extends IPixi {
}

@PixiElement('blurfilter', [])
export class PixiBlurFilterController extends PixiController  implements IPixi, IPostInitialize {

    @Inject()
    fillColor: number = 0xFFFFFF;

    @Inject()
    lineStyle: number = 5;

    @Inject()
    borderRadius: number = 0;

    postInitialize(): void {
        console.log('blur filter : ', this.borderRadius)
        if (this.parent instanceof Sprite) {
            const graphics = new Graphics();
            graphics.beginFill(this.fillColor, 0.1)
            graphics.lineStyle(this.lineStyle, 0x000000);


            graphics.drawRoundedRect(this.parent.x,
                this.parent.y,
                this.parent.texture.width,
                this.parent.texture.height, this.borderRadius);
            graphics.endFill();

            const blur = new BlurFilter()
            graphics.filters = [blur];

            // this.parent.filters = [blur]
            this.parent.addChild(graphics);
            // blur.blur = 100;
        }
    }
}

@PixiElement('maskfilter', [])
export class PixiMaskFilterController extends PixiController  implements IPixi, IPostInitialize {
    @Inject() width: number = 0;
    @Inject() height: number = 0;
    @Inject() x: number = 0;
    @Inject() y: number = 0;
    @Inject() lineStyle = 5;
    @Inject() borderRadius = 50;

    postInitialize(): void {
        console.log('initialize ', this.parent)

        if (this.parent instanceof PixiContainerElement) {
            const graphics = new Graphics();
            graphics.beginFill(0XFFFFFF, 0.1)
            graphics.lineStyle(this.lineStyle, 0x000000);

            graphics.drawRoundedRect(this.x,
                this.y,
                this.width,
                this.height, this.borderRadius);
            graphics.endFill();

            // this.parent.filters = [blur]
            this.parent.addChild(graphics);
            this.parent.mask = graphics;
            // blur.blur = 100;
        }
    }
}
