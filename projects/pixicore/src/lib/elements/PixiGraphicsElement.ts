import { Graphics } from "pixi.js";
import { CONST } from "../utils/const";
import { getData } from "../utils/getData";
import { IPixi } from "./IPixiUpdate";
import { PixiData } from "./PixiData";
import { PixiElement } from "./PixiElement";


@PixiElement('graphics', CONST.DEFAULT_DATAKEYS)
export class PixiGraphics extends Graphics implements IPixi {
    getPixiData(): PixiData {
        return getData(this)
    }
}

export interface PixiGraphics extends IPixi {
}