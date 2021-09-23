import {Observable, Observer, of} from "rxjs";
import { map, switchMap, shareReplay, startWith } from "rxjs/operators";
import AsyncInspector from "./AsyncInspector";
import connection from "./connection";
import instances$ from "./instances$";
import Inspector from "./Inspector";
import {PixiInstanceStatus} from "./devconnection";
export type InspectorInstance = {
  version: string,
  status: PixiInstanceStatus,
  connection: any,
  frameURL?: string,
  index: number;
}
/**
 * Select in the last frame (with pixi) the last detected pixi instance.
 */
export const latestInstance$: Observable<InspectorInstance | null> = instances$.pipe(
  map((frames) => {
    if (frames.length === 0) {
      return null;
    }
    const frame = frames[frames.length - 1];
    if (frame.data.length === 0) {
      return null;
    }
    const instance = frame.data[frame.data.length - 1];
    return {
      version: instance.version,
      status: instance.status,
      connection: frame.from,
      frameURL: frame.frameURL,
      index: frame.data.length - 1,
    };
  })
);
/**
 * Create a AsyncInspector for the detected instance
 */
const latestInspector$: Observable<AsyncInspector | null> = latestInstance$.pipe(
  switchMap((instance: InspectorInstance | null) => {
    if (instance === null) {
      return of(null);
    }
    return connection
      .to(instance.connection)
      .get("INSPECTOR", instance.index)
      .pipe(
        switchMap((index) =>
          new Observable((observer: Observer<AsyncInspector | null>) => {
            const inspector = new AsyncInspector(index, {
              frameURL: instance.frameURL,
            });
            observer.next(inspector);
            inspector.enable();
            return () => {
              inspector.disable();
            };
          })
        )
      );
  }),
  shareReplay(1)
);

export default latestInspector$;
