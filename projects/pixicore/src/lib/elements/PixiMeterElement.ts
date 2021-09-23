import {AnimatedSprite} from "@pixi/sprite-animated"
import {Texture} from "@pixi/core"
import {CONST} from "../utils/const";
import {IPixi, IPostInitialize} from "./IPixiUpdate";
import {Inject, PixiElement} from "./PixiElement";
import {PixiContainerElement} from "./PixiContainerElement";
import {PixiBitmapTextElement} from "./PixiBitmapText";
import {PixiSpriteElement} from "./PixiSpriteElement";


@PixiElement('meter', CONST.DEFAULT_DATAKEYS)
export class PixiMeterElement extends PixiContainerElement implements IPixi, IPostInitialize {
    @Inject() text: PixiBitmapTextElement | null = null;
    @Inject() background: PixiSpriteElement | null = null;

    private readonly formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    postInitialize() {
        super.postInitialize()
    }

    setValue(val: number) {
        if (this.text) {
            this.text.text = this.formatter.format(val/100);
        }
    }
}

// to enable intellisense and silence errors
export interface PixiMeterElement extends IPixi {
}
