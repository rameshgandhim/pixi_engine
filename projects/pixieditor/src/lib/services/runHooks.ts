import { Renderer } from "@pixi/core";
import { Container } from "@pixi/display";
import { getProperty } from "@pixicore";
import { Hooks, IHook } from "./Inspector";

let runningHooks = false;

export default function runHooks(hooks: IHook[], container: Container, renderer: Renderer) {
  if (!runningHooks) {
    runningHooks = true;
    for (const h in hooks) {
      const hook = getProperty(hooks, h)
      if (hook.skip) {
        continue;
      }
      hook.callback(container, renderer);
      if (hook.throttle) {
        hook.skip = true;
        setTimeout(() => {
          hook.skip = false;
        }, hook.throttle);
      }
    }
    runningHooks = false;
  }
}
