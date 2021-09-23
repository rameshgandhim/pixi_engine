import { DataKeyType } from "../utils/const";

export enum PixiTraits {
    None = 0,
    DontSave = 1 << 0, // 0001
}

export interface IPixi {
    type?: string
    id?: string
    dataKeys?: DataKeyType
    flags?: PixiTraits
}


export interface IPostInitialize {
    postInitialize(): void;
}

export interface IDestroy {
    destroy(): void;
}

export interface IPixiTick extends IPixi {
    tick(): void;
}

export function isPixiElement(arg: any): arg is IPixi {
    return arg && arg.type && typeof(arg.type) == 'string';
}

export function isPixiTick(arg: any): arg is IPixiTick {
    return checkArg(arg, 'tick', 'function');
}

export function isPostInitialize(arg: any): arg is IPostInitialize {
    return checkArg(arg, 'postInitialize', 'function');
}

export function isDestroy(arg: any): arg is IDestroy {
  return checkArg(arg, 'destroy', 'function');
}

function checkArg(instance: any, arg: string, argType: string) {
    return instance && instance[arg] && typeof(instance[arg]) == 'function';
}
