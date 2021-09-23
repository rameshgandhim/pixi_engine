import {Container, DisplayObject} from "@pixi/display";
import {IPointData} from "@pixi/math";
import {getData} from "../utils/getData";
import {setData} from "../utils/setData";
import {updateData} from "../utils/updateData";
import {PixiData} from "./PixiData";
import * as utils from '../utils/utils';
import {PixiElement} from "./PixiElement";
import {PixiManager} from "./PixiManager";
import {Point} from "pixi.js";
import {CONST} from "../utils/const";
import {IPixi, IPostInitialize, isPixiElement} from "./IPixiUpdate";
import {Subject} from "rxjs";

export type UpdateFlag = {
    name: string,
    func: string | Function
}

@PixiElement("container")
export class PixiContainerElement extends Container implements IPixi, IPostInitialize {

    minWidth = 0;
    minHeight = 0;
    _updateFlags: UpdateFlag[] = [];
    _hasFlags = this._updateFlags.length > 0;
    resizeScaling = false;
    localScaleX = 0;
    localScaleY = 0;
    worldWidth = 0;
    worldHeight = 0;
    redraw = false;

    mouseClick: Subject<void> = new Subject<void>()
    mouseUp: Subject<void> = new Subject<void>()
    mouseDown: Subject<void> = new Subject<void>()
    mouseOver: Subject<void> = new Subject<void>()
    mouseMove: Subject<void> = new Subject<void>();

    constructor() {
        super();
    }

    postInitialize() {
        this.initializeHandlers()
    }

    private initializeHandlers() {
        this.addListener("click", (event) => this.onMouseClick(event));
        // this.addListener("mousedown", (event) => this.onMouseDown(event));
        this.addListener("pointerdown", (event) => this.onMouseDown(event));
        this.addListener("pressup", (event) => this.onMouseUp(event));
        this.addListener("pressmove", (event) => this.onMouseMove(event));
        this.addListener("mouseover", (event) => this.onMouseOver(event));
        this.addListener("mouseout", (event) => this.onMouseOut(event));
    }

    protected onMouseClick(event: MouseEvent) {
        this.mouseClick.next()
    }

    protected onMouseDown(event: MouseEvent) {
        this.mouseDown.next()
    }

    protected onMouseUp(event: MouseEvent) {
        this.mouseUp.next()
    }

    protected onMouseMove(event: MouseEvent) {
        this.mouseMove.next()
    }

    protected onMouseOut(event: MouseEvent) {

    }

    protected onMouseOver(event: MouseEvent) {

    }

    removeChildByNameRecursive(name: string) {
        var child = this.getChildByNameRecursive(name);
        if (child) {
            child.parent.removeChild(child as DisplayObject);
        }
    }

    getChildByNameRecursive(name: string): PixiContainerElement | null {
        for (let i = 0; i < this.children.length; i++) {
            if (!(this.children[i] instanceof PixiContainerElement)) {
                continue
            }
            let child = this.children[i] as PixiContainerElement;
            if (child.name == name) {
                return child;
            }
            if (typeof (child.getChildByNameRecursive) !== 'undefined') {
                child = child.getChildByNameRecursive(name)!;
                if (child !== null) {
                    return child;
                }
            }
        }
        return null;
    };


    toLocal<P extends IPointData = Point>(position: IPointData, from?: DisplayObject, point?: P, skipUpdate?: boolean): P {
        // toLocal(global: IPointData, from: DisplayObject) {
        if (this.resizeScaling) {
            var local = super.toLocal(position, from, point, skipUpdate);
            local.x *= this.localScaleX;
            local.y *= this.localScaleY;

            return local;
        } else {
            return super.toLocal(position, from, point, skipUpdate);
        }
    }

    _checkFlags() {
        for (var i = 0, j = this._updateFlags.length; i < j; i++) {
            var flag = this._updateFlags[i];

            var current = this as any;
            if (current[flag.name]) {

                var func;
                if (typeof flag.func === 'string') {
                    func = current[flag.func];
                } else {
                    func = flag.func
                }

                if (func) {
                    current[flag.name] = func.call(this);
                } else {
                    console.log('Could not update flag ' + flag.name + ' on Element of type ' + this.type);
                }
            }
        }
    }

    updateTransform() {

        var i, j;
        var wt = this.worldTransform;
        // obmit Control.updateTransform as it calls redraw as well
        if (!this.resizeScaling) {
            if (this.redraw) {
                // this.redraw(1, 1);
            }

            if (this._hasFlags) {
                this._checkFlags();
            }

            super.updateTransform();
        } else {
            var pt = this.parent.worldTransform;
            var scaleX = Math.sqrt(Math.pow(pt.a, 2) + Math.pow(pt.b, 2));
            var scaleY = Math.sqrt(Math.pow(pt.c, 2) + Math.pow(pt.d, 2));
            this.worldWidth = Math.round(Math.max(this.width * scaleX, this.minWidth));
            this.worldHeight = Math.round(Math.max(this.height * scaleY, this.minHeight));

            super.updateTransform();

            // revert scaling
            var tx = wt.tx;
            var ty = wt.ty;

            wt.scale(scaleX !== 0 ? 1 / scaleX : 0, scaleY !== 0 ? 1 / scaleY : 0);
            wt.tx = tx;
            wt.ty = ty;

            if (this.redraw) {
                // this.redraw(scaleX, scaleY);
            }

            this.localScaleX = scaleX;
            this.localScaleY = scaleY;


            if (this._hasFlags) {
                this._checkFlags();
            }

            for (i = 0, j = this.children.length; i < j; ++i) {
                this.children[i].updateTransform();
            }
        }
    }
}


export interface PixiContainerElement extends IPixi {
}
