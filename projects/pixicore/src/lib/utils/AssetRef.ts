import { Loader, LoaderResource } from '@pixi/loaders'
import { Type } from "../elements/PixiElementRegistry";
import {FontLoader} from "../fonts/FontLoader";
import { Dict } from '@pixi/utils';

export interface IAsset
{
  /**
   * The path of the asset to be loaded.
   */
  path: string;
  /**
   * Specified ID used to retrieve the IAsset from the IAssetCache.
   */
  id: string;
  /**
   * Raw data that has been loaded.
   */
  data: any;
}

export interface IFrame
{
  x: number;
  y: number;
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
  imageAsset: IAsset;
}

export class AssetRef {
    constructor(public name: string, public path: string, public type: string) {}
}

export class AssetBundle {
    public assetList: AssetRef[] = []
}

export function FromJSON<T>(type: Type<T>, json: string) {
    const instance = new type();
    Object.assign(instance, JSON.parse(json))
    return instance;
}

export class AssetLoader {
    private files: Record<string, string> = {};
    private loader: Loader;
    private fontLoader = new FontLoader();
    private loadedAssets: IAsset[] = [];
    constructor(private basePath: string) {
        this.loader = new Loader(basePath);
    }

    getResource(resourceName: string): LoaderResource {
      return this.loader.resources[resourceName]
    }
    public addBundle(bundle: AssetBundle): AssetLoader {
        return this;
    }

    public addFile(alias: string, path: string): AssetLoader
    {
        this.files[alias] = path;
        return this;
    }

    public load(cb?: () => void): AssetLoader {
        for(const f in this.files) {
            this.loader.add(f, this.files[f]);
        }
        this.loader.onProgress.add((l, r) => this.onProgress(l, r))
        this.loader.onComplete.add((l, r) => this.onComplete(l, r))
        // this.loader.onError.add((l, r) => this.onError(l, r))
        this.loader.load(() => this.loadFonts(cb))
        return this;
    }

    private loadFonts(cb?: () => void): void {
        console.log('asets loaded, loading fonts')
        for(const file in this.files) {
            this.loadedAssets.push({
                id: file,
                data: this.loader.resources[file],
                path: this.basePath + '/' + this.files[file]
            })
        }

        this.fontLoader.start(this.loadedAssets)
            .onLoadComplete.subscribe(() => this.onLoadComplete(cb))
    }

    private onLoadComplete(cb?: () => void) {
        console.log('full load complete')
        if (cb) {
            cb();
        }
    }

    private onProgress(loader: Loader, lr: LoaderResource) {
        console.log('loading : ', lr.url)
    }
    private onComplete(loader: Loader, lr: LoaderResource) {
        console.log('loading completed : ', lr.url)
    }
    private onError(loader: Loader, lr: LoaderResource) {
        console.log('loading error : ', lr.url)
    }
}
