import {Texture} from "@pixi/core";
import {Sprite} from "@pixi/sprite";
import {CONST} from "../utils/const";
import {getData} from "../utils/getData";
import {updateData} from "../utils/updateData";
import {IPixi} from "./IPixiUpdate";
import {PixiData} from "./PixiData";
import {PixiElement} from "./PixiElement";

@PixiElement("sprite", [...CONST.DEFAULT_DATAKEYS, 'source'])
export class PixiSpriteElement extends Sprite implements IPixi {

    constructor() {
        super();
    }

    updatePixiData(data: PixiData) {
        updateData(this, data);
    };

    /**
     * get data of SpriteElement (including defaults)
     *
     * @returns data {Object} representing the sprite
     */
    getPixiData(): PixiData {
        return getData(this);
    };

    set source(value: string) {
        this.texture = Texture.from(value);
    }

    get source(): string {
        // return this.texture.image;
        return this.texture.textureCacheIds[0];
    }
}

export interface PixiSpriteElement extends IPixi {
}
