export type DataKeyType = (string | string[])[]

export type ConstData  = {
    VERSION: string,
    DEFAULT_DATAKEYS: DataKeyType
}

export const CONST : ConstData = {
    /**
     * String of the current POM.Manager version
     *
     * @static
     * @constant
     * @property {string} VERSION
     */
    VERSION: '1.0.0', //require('../../../../../package.json').version,
    DEFAULT_DATAKEYS: [
        'name',
        ['position', 'x'],
        ['position', 'y'],
        ['scale', 'x'],
        ['scale', 'y'],
        ['transform', 'position', 'x'],
        ['transform', 'position', 'y'],
        ['transform', 'scale', 'x'],
        ['transform', 'scale', 'y'],
        'alpha',
        'rotation',
        ['pivot', 'x'],
        ['pivot', 'y']
    ]
};
