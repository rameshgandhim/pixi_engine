import {AnimatedSprite} from "@pixi/sprite-animated"
import {Texture} from "@pixi/core"
import {CONST} from "../utils/const";
import {IPixi, IPostInitialize} from "./IPixiUpdate";
import {Inject, PixiElement} from "./PixiElement";
import {PixiContainerElement} from "./PixiContainerElement";
import {Subject} from "rxjs";


@PixiElement('button', CONST.DEFAULT_DATAKEYS)
export class PixiButtonElement extends PixiContainerElement implements IPixi, IPostInitialize {
    private enabled: boolean = false;
    private animatedSprite: AnimatedSprite | null = null;

    @Inject() frames: string[] = [];
    @Inject() set enable(val: boolean) {
        this.enabled = val;
        console.log('setting enable: ', val)
        this.interactive = val;
    }

    @Inject() eventName: string = '';

    postInitialize() {
        super.postInitialize()
        this.createButtonSprite()
        this.interactive = true;
    }

    private createButtonSprite() {
        let textureArray = [];
        for (let i = 0; i < this.frames.length; i++) {
            let texture = Texture.from(this.frames[i]);
            textureArray.push(texture);
        }

        console.log('creating button for ', this.name, this.frames)
        this.animatedSprite = new AnimatedSprite(textureArray);
        this.addChild(this.animatedSprite)
    }

    public setEnable(b: boolean) {
        this.enable = b;
    }
}

// to enable intellisense and silence errors
export interface PixiButtonElement extends IPixi {
}
