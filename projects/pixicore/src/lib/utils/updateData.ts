import { IPixi } from '../elements/IPixiUpdate';
import { PixiData } from '../elements/PixiData';
import * as utils from './utils';

function _updateValue(elem: any, value: any, key: any) {
    if (value[key] && typeof value[key] === 'object' && !Array.isArray(value[key])) {
        /**
         If the upper level value does not exist yet,
         we have to create an array or object,
         so that the lower level values can be added
         **/
        if(!elem[key]){
            if(utils.isArray(value[key])){
                elem[key] = [];
            } else {
                elem[key] = {};
            }
        }

        if (utils.isArray(value[key])) {
            elem[key] = value[key]
        } else {
            for (var k in value[key]) {
                _updateValue(elem[key], value[key], k);
            }
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
function updateValues(element: IPixi, values: PixiData) {
    // preinitialize variable
    var elem = element;

    for (var property in values) {
        _updateValue(elem, values, property);
    }
}

export function updateData(element: IPixi, data: PixiData) {
    updateValues(element, data.values||{});
}