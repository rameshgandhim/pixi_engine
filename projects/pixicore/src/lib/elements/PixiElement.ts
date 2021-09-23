import { IPixi } from "./IPixiUpdate";
import { PixiElementRegistry, Type } from "./PixiElementRegistry";
import 'reflect-metadata'
import { CONST, DataKeyType } from '../utils/const';

// type Parameters<T> = T extends (... args: infer T) => any ? T : never; 

export function PixiElement(name: string, dataKeys?: DataKeyType) {
    return <T extends { new (...args: any[]): {} }> (constructor: T) => {
        const newClass = class extends constructor implements IPixi {
            type = name
            dataKeys = dataKeys ?? CONST.DEFAULT_DATAKEYS
        }
        PixiElementRegistry.add(name, newClass);
        PixiElementRegistry.changeProp(constructor, newClass);
        return newClass;
    }
}

export function Inject() {
    return function(target: Object, propertyKey: string) {
        PixiElementRegistry.addProp(target.constructor as Type<unknown>, propertyKey)
    }
}