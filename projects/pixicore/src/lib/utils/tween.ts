import { IPixiTick } from "../elements/IPixiUpdate";

// Basic lerp funtion.
export function lerp(a1: number, a2: number, t: number): number {
    return a1 * (1 - t) + a2 * t;
}

// Backout function from tweenjs.
// https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
export function backout(amount: number): (a: number) => number {
    return (t: number) => (--t * t * ((amount + 1) * t + amount) + 1);
}


export class Tweener implements IPixiTick {

    tweening: any[] = [];

    tick() {
        const now = Date.now();
        const remove = [];
        for (let i = 0; i < this.tweening.length; i++) {
            const t = this.tweening[i];
            const phase = Math.min(1, (now - t.start) / t.time);

            t.object[t.property] = lerp(t.propertyBeginValue, t.target, t.easing(phase));
            if (t.change) t.change(t);
            if (phase === 1) {
                t.object[t.property] = t.target;
                if (t.complete) t.complete(t);
                remove.push(t);
            }
        }
        for (let i = 0; i < remove.length; i++) {
            this.tweening.splice(this.tweening.indexOf(remove[i]), 1);
        }
    }

    // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
    tweenTo(object: any,
        property: any, target: any, time: number, easing: any, 
        onchange: Function | null, oncomplete: Function | null) {
        const tween = {
            object,
            property,
            propertyBeginValue: object[property],
            target,
            easing,
            time,
            change: onchange,
            complete: oncomplete,
            start: Date.now(),
        };

        this.tweening.push(tween);
        return tween;
    }
}

export interface Tweener {
    type?: string
    id?: string
}