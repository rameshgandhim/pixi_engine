/* global PIXI */
/* eslint-disable no-console, class-methods-use-this */
import {Subject, of, never, Observable} from "rxjs";
import Inspector from "./Inspector";

const commands = {
  TREE: new Subject(),
  SELECTED: new Subject(),
  DETECT: null,
  INSTANCES: null,
  PANEL_VISIBLE: null,
  INSPECTOR: null,
  DETECTED: null,
  DISCONNECTED: null
};

declare var window: any;

export type EmitFn = (command: CommandType, data: any) => void;
export type CommandType = keyof typeof commands;
export type PixiInstanceType = {
    PIXI: any,
    Phaser: any
}

let inspector : any | null = null;

if (!window.PIXI) {
  console.warn("DevConnection requires a global PIXI object");
}
let _PIXI = window.PIXI;

function getPIXI() {
  if (!_PIXI) {
    _PIXI = window.PIXI
  }
  return _PIXI;
}

function emit(command: CommandType, data: any) {
  if (commands[command]) {
    return commands[command]?.next(
      JSON.parse(JSON.stringify({ command, data }))
    );
  }
  console.warn("Unsupported emit", command);
}

export type PixiInstanceStatus = "INJECTED"
export type PixiStatus = {
  status: PixiInstanceStatus,
  version: string
}
export type PixiInstance = {
  data: PixiStatus[]
  from?: any;
  frameURL?:string;
}

export function isPixiInstance(instance: any): instance is PixiInstance {
  return instance && instance.data && Array.isArray(instance.data)
}

export type PixiPanelVisible = {
  data: boolean
  from?: any;
}

export class DevClient {
  send(command: CommandType) {
    if (command === "DETECT") {
      return;
    }
    console.warn("Unsupported send", command);
  }
  stream(command: CommandType): Observable<PixiInstance | PixiPanelVisible> {
    if (command === "INSTANCES") {
      return of({
        data: [{ status: "INJECTED", version: getPIXI().VERSION }],
      });
    }
    if (command === "PANEL_VISIBLE") {
      return of({ data: true });
    }
    console.warn("Unsupported stream", command);
    return never();
  }
  get(command: CommandType, index?: number) {
    if (command === "INSPECTOR") {
      if (!inspector) {
        inspector = new Inspector({ PIXI: getPIXI(), Phaser: window.Phaser }, emit);
      }
      window.pixiInspector = inspector;
      return of(inspector);
    }
    throw new Error('Unsupported get "' + command + '"');
  }
  set(command: CommandType) {
    throw new Error('Unsupported set "' + command + '"');
  }
}
export default class DevConnection {
  to(type: string) {
    return new DevClient();
  }
  on(command: CommandType): Observable<any> {
    if (commands[command]) {
      return commands[command]!;
    }
    if (command === "DETECTED") {
      return never();
    }
    if (command === "DISCONNECTED") {
      return never();
    }
    console.warn("Unsupported connection.on", command);
    return never();
  }
}
