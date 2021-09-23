import { Spritesheet } from "@pixi/spritesheet";
import { AnimatedSprite, FrameObject } from "@pixi/sprite-animated";
import { CONST } from "../utils/const";
import { Texture } from '@pixi/core';
import { getData } from "../utils/getData";
import { IPixi } from "./IPixiUpdate";
import { PixiData } from "./PixiData";
import { PixiElement } from "./PixiElement";


@PixiElement('movie', CONST.DEFAULT_DATAKEYS)
export class PixiMovieClipElement extends AnimatedSprite implements IPixi {
  _fps: number = 60;
  _now: number = this.getTime();
  _then: number = this.getTime();
  get fps(): number {
    return this._fps;
  }
  set fps(f: number) {
    this._fps = f;
    this.animationSpeed = 1 / f;
  }

  constructor(textures: Texture[] | FrameObject[], autoUpdate?: boolean) {
    super(textures);
  }

  update(deltaTime: number) {
    super.update(deltaTime);
  }

  protected getTime() : number {
    if (performance) {
      return performance.now()
    } else {
      return Date.now()
    }
  }
}

// to enable intellisense and silence errors
export interface PixiMovieClipElement extends IPixi {
}
