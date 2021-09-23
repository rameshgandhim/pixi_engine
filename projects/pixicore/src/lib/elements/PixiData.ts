import { IApplicationOptions } from "@pixi/app";

export type TValue = {
  [x: string]: string | number | null | TValue | boolean | Function
} | any;

export interface IValueProperty {
  value: TValue
}

export function isValueProperty(arg: any): arg is IValueProperty {
  return arg && arg.value &&
    (typeof arg.value == 'string' ||
    typeof arg.value == 'object' ||
    typeof arg.value == 'number');
}

export type TProperty = {
  [key: string]: number | IValueProperty | number[] | null
};
export type TController = PixiData

export type PixiData = {
  // type?: string;
  values?: TValue;
  children?: PixiData[];
  type: string;
  id?: string;
  properties?: TProperty;
  controllers?: TController[]
}

export type PixiApp = {
  settings: IApplicationOptions,
  assets: Record<string, string>
  scene: PixiData
}
