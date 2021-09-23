import {BitmapText} from "@pixi/text-bitmap"
import {Text} from "@pixi/text"
import {CONST} from "../utils/const";
import {IPixi, IPostInitialize} from "./IPixiUpdate";
import {Inject, PixiElement} from "./PixiElement";

const bitMapTextKeys = [
    'fontName',
    'fontSize',
    'tint',
    'align',
    'letterSpacing',
    'maxWidth',
]

@PixiElement('bitmaptext', [...CONST.DEFAULT_DATAKEYS, ...bitMapTextKeys])
export class PixiBitmapTextElement extends BitmapText implements IPixi, IPostInitialize {

    postInitialize() {
    }
}
// to enable intellisense and silence errors
export interface PixiBitmapTextElement extends IPixi {
}


const textKeys = [
    ['style', 'align'],
    ['style', 'fill'],
    ['style', 'lineHeight'],
    ['style', 'fontSize'],
    ['style', 'fontFamily'],
    ['style', 'stroke'],
    ['style', 'strokeThickness'],
    ['style', 'padding'],
    ['style', 'wordwrap'],
    ['style', 'wordwrapWidth'],
    ['style', 'dropShadow'],
    ['style', 'dropShadowColor'],
    ['style', 'dropShadowBlur'],
    ['style', 'dropShadowAngle'],
    ['style', 'dropShadowDistance'],
    ['style', 'lineJoin'],
    "text",
    'letterSpacing',
    'maxWidth',
    'width',
    'height'
]

@PixiElement('text', [...CONST.DEFAULT_DATAKEYS, ...textKeys])
export class PixiTextElement extends Text implements IPixi, IPostInitialize {

    postInitialize() {
    }
}

// to enable intellisense and silence errors
export interface PixiTextElement extends IPixi {
}
