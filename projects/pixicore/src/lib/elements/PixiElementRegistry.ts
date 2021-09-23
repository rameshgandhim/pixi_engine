
// export type Type = FunctionConstructor;

export interface NonAbstractType<T> extends Function {
    new (...args: any[]): T;
}

type AbstractType<T> = abstract new (...args: any[]) => T;

export type Type<T> = NonAbstractType<T> | AbstractType<T>

export type PixiElementType = {
    [key: string] : Type<unknown>
}

export class PixiElementRegistry {
    private static registry: PixiElementType = {};
    private static properties: Map<Type<unknown>, string[]> = new Map<Type<unknown>, string[]>();


    static add(key: string, value: Type<unknown>): void {
        this.registry[key] = value;
    }

    static remove(key: string): void {
        delete this.registry[key];
    }

    static get(key: string): Type<unknown> | null {
        if (key in this.registry) {
            return this.registry[key];
        }
        return null;
    }

    static changeProp(key: Type<unknown>, key2: Type<unknown>): void { 
        if (this.properties.has(key)) {
            this.properties.set(key2, this.properties.get(key)!);
        }
    }

    static addProp(key: Type<unknown>, value: string): void {
        let props: string[];
        if (!this.properties.has(key)) {
            props = [];
            this.properties.set(key, props);
        } else {
            props = this.properties.get(key)!;
        }
        if (!props.includes(value)) {
            props.push(value)
        }
    }

    static getProp(key: Type<unknown>): string[] | null {
        if (this.properties.has(key)) {
            return this.properties.get(key)!;
        }
        return null;
    }

    static getAllKeys(): string[] {
        return Object.keys(this.registry);
    }
}