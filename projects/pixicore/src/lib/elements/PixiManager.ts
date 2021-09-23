import { Application, Container, DisplayObject } from "pixi.js";
import { AssetLoader } from "../utils/AssetRef";
import { getData } from "../utils/getData";
import { setProperty } from "../utils/setData";
import { updateData } from "../utils/updateData";
import {IPixi, IPixiTick, isDestroy, isPixiElement, isPixiTick, isPostInitialize, PixiTraits} from "./IPixiUpdate";
import { PixiContainerElement } from "./PixiContainerElement";
import { PixiController } from "./PixiController";
import { isValueProperty, PixiData, TController } from "./PixiData";
import { PixiElementType, PixiElementRegistry, Type } from "./PixiElementRegistry";

export class PixiIdManager {
    private static currentId = 0;
    private static readonly excludedList: number[] = [];

    static getNextId() {
        ++this.currentId;
        while (this.excludedList.includes(this.currentId)) {
            ++this.currentId;
        }

        return this.currentId;
    }

    static addBlackList(id: number) {
        this.excludedList.push(id);
    }
}

export type InstanceType = {
    type: Type<unknown>,
    instance: IPixi
}


export type ServiceInstance = {
    type: Type<unknown>,
    instance: any
};

export class PixiManager {

    _plugins: PixiElementType = {};
    plugins: {
        [key: string]: any
    } = {};
    view: PixiContainerElement;
    elementRegistry: Map<number, InstanceType> = new Map<number, InstanceType>();
    injectionRegistry: Map<Type<unknown>, any> = new Map<Type<unknown>, any>();
    tickers: IPixiTick[] = [];

    constructor(private app: Application) {
        app.ticker.add((d) => this.tick(d))
        this.injectionRegistry.set(PixiManager, this);
        this.view = new PixiContainerElement();
        // always mark head as zero
        this.view.id = "0";
        this.addElement(this.view, this.view.constructor as Type<unknown>)
    }

    addService(type: Type<unknown>, instance: any) {
        this.addToTickers(instance);
        this.injectionRegistry.set(type, instance);
    }

    init(data: PixiData) {
        this.createControllers(this.view, data.controllers)
        this.doUpdateData(this.view, data);
        this.performInjection(data);
        this.doPostInitialize();
    }

    getPixiData(): PixiData {
        return this.getData(this.view);
    }

    private getData(element: IPixi) {
        const children = [];
        if (element instanceof Container) {
            for (var i = 0; i < element.children.length; i++) {
                const child = element.children[i];
                if (isPixiElement(child)) {
                    if (child.flags && (child.flags & PixiTraits.DontSave) == PixiTraits.DontSave) {
                        continue
                    }
                    children.push(this.getData(child));
                }
            }
        }
        var data = getData(element);
        data.children = children;
        return data;
    };

    tick(delta: number): void {
        if (this.tickers) {
            for (const t of this.tickers) {
                t.tick();
            }
        }
    }

    createElementFromData(data: PixiData): unknown {
        var type = data.type;
        var elementType = PixiElementRegistry.get(type);
        if (elementType) {
            const element = this.createNewInstance(elementType);
            this.assignIdToElement(element, data.id);
            this.addElement(element, elementType);
            this.doUpdateData(element, data)
            this.createControllers(element, data.controllers);
            return element;
        }
        throw new Error('Cannot create element of unknown type ' + type);
    };

    createControllers(parent: IPixi, controllers: TController[] | undefined): PixiController[] | undefined {
        if (controllers) {
            const pixiControllers: PixiController[] = [];
            for (const controller of controllers) {
                pixiControllers.push(this.createController(parent, controller));
            }
            setProperty(parent, 'controllers', pixiControllers)
            return pixiControllers
        }
        return undefined;
    }

    createController(element: IPixi, data: TController): PixiController {
        var type = data.type;
        var controllerType = PixiElementRegistry.get(type);
        if (controllerType) {
            const controller = this.createNewInstance(controllerType);
            this.assignIdToElement(controller, data.id);
            this.addElement(controller, controllerType);
            setProperty(controller, "parent", element)
            return controller
        }
        throw new Error('Cannot create element of unknown type ' + data.type);
    }
    private addElement(element: IPixi, elementType: Type<unknown>) {
        this.elementRegistry.set(+element.id!, {
            type: elementType,
            instance: element
        });
    }
    private createNewInstance(elementType: Type<unknown>): PixiController {
        const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', elementType);
        const parameters: IPixi[] = [];
        paramTypes?.forEach((element: any) => {
            parameters.push(this.injectionRegistry.get(element));
        });
        const element = new elementType(...parameters) as PixiController;
        this.addToTickers(element);
        return element;
    }

    private addToTickers(element: IPixi) {
        if (isPixiTick(element)) {
            this.tickers.push(element)
        }
    }

    private performInjection(data: PixiData): void {
        if (data.children) {
            for (const el of data.children) {
                this.performInjection(el);
            }
        }

        this.performControllerInjection(data);

        if (data.properties && data.id && this.elementRegistry.has(+data.id)) {
            const element = this.elementRegistry.get(+data.id)!
            const required = PixiElementRegistry.getProp(element.type);
            const available = data.properties;

            if (required && available) {
                for (const req of required) {
                    const prop = available[req];
                    let gotValue: any;
                    if (isValueProperty(prop)) {
                        gotValue = prop.value;
                    } else if (typeof prop == 'number') {
                        gotValue = this.elementRegistry.get(+prop)?.instance;
                    } else if (Array.isArray(prop)) {
                        gotValue = [];
                        for (const p of prop) {
                            const instance = this.elementRegistry.get(+p)?.instance;
                            gotValue.push(instance)
                        }
                    }
                    if (gotValue) {
                        setProperty(element.instance, req, gotValue);
                    }
                }
            }
        }
    }

    private performControllerInjection(data: PixiData) {
        if (data.controllers) {
            for (const c of data.controllers) {
                this.performInjection(c);
            }
        }
    }

    private doUpdateData(element: IPixi, data: PixiData) {
        if (data.children) {
            this.doUpdateChildrenData(element, data.children);
        }
        updateData(element, data)
    }

    private doUpdateChildrenData(element: IPixi, children: PixiData[]): void {
        if (element instanceof Container) {
            this.destroyChildren(element);
            for (var i = 0; i < children.length; i++) {
                var createdObj = this.createElementFromData(children[i]);
                if (createdObj instanceof DisplayObject) {
                    element.addChild(createdObj);
                }
            }
        }
    }

    private destroyChildren(container: Container) {
        var children = container.removeChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.destroy) {
                child.destroy();
            }
        }
    };

    private doPostInitialize() {
        for (const element of this.elementRegistry.values()) {
            if (isPostInitialize(element.instance)) {
                element.instance.postInitialize();
            }
        }
    }

    private doDestroy() {
        for (const element of this.elementRegistry.values()) {
            if (isDestroy(element.instance)) {
                element.instance.destroy();
            }
        }
    }

    private assignIdToElement(element: IPixi, id?: string) {
        let elementId = (element.id ?? id ?? '');

        if (elementId) {
            element.id = elementId;
            PixiIdManager.addBlackList(+elementId);
        } else {
            element.id = PixiIdManager.getNextId().toString();
        }
    }

    registerPlugin(pluginName: string, ctor: Type<unknown>) {
        this._plugins[pluginName] = ctor;
    };

    destroyPlugins() {
        for (var o in this.plugins) {
            this.plugins[o].destroy();
            this.plugins[o] = null;
        }

        this.plugins = {};
    };

    destroy() {
        this.destroyPlugins();
        this.doDestroy();
        this.view?.destroy(true);
    }
}
