import {of, empty, Observable, EMPTY} from "rxjs";
import { switchMap, startWith, merge, map } from "rxjs/operators";
import connection from "./connection";
import active$ from "./active$";
import {isPixiInstance, PixiInstance} from "./devconnection";


/**
 * @var {Observable} All frames which have detected one ore more PIXI instances.
 */
const instances$: Observable<PixiInstance[]> = active$.pipe(
  switchMap((active) => {
    if (!active) {
      return of([]);
    }
    connection.to("content_scripts").send("DETECT");
    const frames: PixiInstance[] = [];
    // @todo Detect when a frame was closed/reloaded.
    return connection.on("DETECTED").pipe(
      startWith(null),
      switchMap(() => connection.to("content_scripts").stream("INSTANCES")),
      switchMap((message) => {
        if (isPixiInstance(message)) {
          const index = frames.findIndex((frame) => frame.from === message.from);
          if (message.data.length === 0) {
            if (index === -1) {
              return EMPTY;
            }
            frames.splice(index, 1);
            return of(frames);
          }

          // chrome.devtools.inspectedWindow.eval('console.info(window.PIXI || "no pixi :(")', { frameURL: message.frameURL }, function (...args) {
          //   connection.log(...args)
          // })
          if (index === -1) {
            frames.push(message);
          } else {
            frames[index] = message;
          }
          return of(frames);
        }
        else
        {
          return EMPTY;
        }
      }),
      merge(
        connection
          .on("DISCONNECTED")
          .pipe(
            map((message) =>
              frames.filter((frame) => frame.from !== message.from)
            )
          )
      )
    );
  })
);

export default instances$;
