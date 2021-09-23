import { IPixi, isPixiElement } from "../elements/IPixiUpdate";
import { PixiController } from "../elements/PixiController";
import { PixiData, TController, TProperty } from "../elements/PixiData";
import { PixiElementRegistry, Type } from "../elements/PixiElementRegistry";

function getValues(element: IPixi) {
    let values: any = {};
    let data, key;
    let elem = element;

    if (element.dataKeys) {
        for (let i = 0; i < element.dataKeys.length; i++) {
            const property = element.dataKeys[i];
            try {
                if (typeof property == 'function') {
                    values[property] = getProperty(element, property);
                } else if (typeof property === 'string') {
                    values[property] = getProperty(element, property);
                } else {
                    elem = element;
                    key = [...property] as any;
                    data = values;
                    while (key.length > 1) {
                        var k = key.shift();
                        if (!data.hasOwnProperty(k)) {
                            data[k] = {};
                        }
                        data = data[k];
                        elem = getProperty(elem, k);
                    }
                    key = key[0];
                    data[key] = getProperty(elem, key);
                }
            } catch (e: any) {
                if (console && console.error) {
                    console.error('Property "' + property + '" could not be gotten from Element ' + getProperty(element, "name") + ' of type "' + element.type + '"');
                    console.error(e.message);
                }

                values[property.toString()] = undefined;
            }
        }
    }
    return values;
}

function getControllers(element: IPixi): TController[] | undefined {
    const controllers = getProperty(element, 'controllers') as PixiController[]
    if (controllers) {
        const values: TController[] = []
        for(const c of controllers) {
            values.push(getData(c))
        }
        return values;
    }
    return undefined;
}

function getProperties(element: IPixi): TProperty | undefined {
    const result: TProperty = {};
    const props = PixiElementRegistry.getProp(element.constructor as Type<unknown>)
    if (props) {
        for (const prop of props) {
            const val = getProperty(element, prop);
            if (Array.isArray(val) && val.length > 0 && isPixiElement(val[0])) {
                let pixiElements = []
                for (let i = 0; i < val.length; i++) {
                    pixiElements.push(+(val[i]?.id ?? "-1"))
                }
                result[prop] = pixiElements
            } else if (isPixiElement(val)) {
                result[prop] = +(val.id ?? "-1")
            } else {
                result[prop] = { "value" : val };
            }
        }
    }
    return result;
}

export function getProperty(obj: any, prop: string): any {
    return obj[prop];
}

export function getData(element: IPixi): PixiData {
    return {
        'type': element.type ?? '',
        'id': element.id ?? '0',
        'values': getValues(element),
        'controllers': getControllers(element),
        'properties': getProperties(element)
    };
}
