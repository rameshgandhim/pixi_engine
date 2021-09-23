import { IPixi } from "../elements/IPixiUpdate";
import { PixiData } from "../elements/PixiData";
import * as utils from "./utils";

function _setValue(elem: any, value: any, key: any) {

    if (typeof elem[key] == 'function') {
        var args = value[key];
        if (!utils.isArray(args)) {
            args = [args];
        }
        elem[key].apply(elem, args);
    } else if (value[key] && typeof value[key] === 'object') {

        //First we remove all previous data
        if (utils.isArray(value[key])) {
            elem[key] = [];
        } else if (!elem[key]) {
            elem[key] = {}; //We cant do this all the time because we might have an object of a specific class
        }


        for (var k in value[key]) {
            _setValue(elem[key], value[key], k);
        }
        elem[key] = elem[key];
    } else {
        // set string, int, ... value directly
        elem[key] = value[key];
    }
}


/**
 * update data for element
 *
 * @param element {Object} some element
 * @param values {Object} data that need to be set for the object
 */
function setValues(element: IPixi, values: PixiData) {
    for (var property in values) {
        try {
            _setValue(element, values, property);
        } catch (e: any) {
            if (console && console.error) {
                console.error('Property "' + property + '" could not be set on Element ' + (element as any).name + ' of type "' + element.type + '"');
                console.error(e.message);
            }
        }
    }
}

export function setData(element: IPixi, data: PixiData) {
    setValues(element, data.values || {});
}


export function setProperty(element: any, property: string, value: any) {
    element[property] = value;
}
