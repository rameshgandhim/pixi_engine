import {IAsset} from "../utils/AssetRef";
import {Subject} from "rxjs";
import {FontWatcher} from "./FontWatcher";


/**
 * The FontLoader manages loading of font files from the provided assets.
 *
 * @export
 * @class FontLoader
 * @extends {borgevent.EventDispatcher}
 */
export class FontLoader {
    /**
     * List of assets to attempt font loading on.
     *
     * @protected
     * @type {IAsset[]}
     */
    protected _assets: IAsset[] = [];
    /**
     * Amount of files that have sucessfully loaded.
     *
     * @protected
     * @type {number}
     */
    protected _loaded: number = 0;
    /**
     * Amount of files that have failed loading.
     *
     * @protected
     * @type {number}
     */
    protected _failed: number = 0;

    onLoadComplete: Subject<void> = new Subject();

    onProgress: Subject<number> = new Subject<number>();

    /**
     * Creates an instance of FontLoader.
     */
    constructor() {
    }

    /**
     * Start the loading prcoess. Any non font files from the asset list are ignored.
     *
     * @param {IAsset[]} assets List of assets to attempt to load.
     */
    public start(assets: IAsset[]): FontLoader {
        this._assets = [];
        for (var i: number = 0; i < assets.length; i++) {
            var fileParts: string[] = assets[i].path.split(".");
            var fileType: string = fileParts[fileParts.length - 1].toLowerCase();
            //console.log(fileType);
            if (fileType == "otf" || fileType == "ttf") {
                this._assets.push(assets[i]);
            }
        }
        if (this._assets.length > 0) {
            this.loadFontAssets();
        } else {
            this.onLoadComplete?.next();
        }
        return this;
    }

    /**
     * Attempts to load the font for all the assets identified as fonts.
     *
     * @protected
     */
    protected loadFontAssets(): void {
        this._loaded = 0;
        this._failed = 0;
        for (var i: number = 0; i < this._assets.length; i++) {
            var fontName = this._assets[i].id;
            var styleElement: Element = document.createElement('style');
            var fontDesc: string = "@font-face {" +
                "font-family: \"" + fontName + "\";" +
                "src: url(\"" + this._assets[i].path + "\") format(\"opentype\");" +
                "}";
            styleElement.appendChild(document.createTextNode(fontDesc));
            document.head.appendChild(styleElement);
            var fontWatcher: FontWatcher = new FontWatcher(fontName, 5000);
            fontWatcher.onComplete = () => this.onFontComplete();
            fontWatcher.onTimeout = () => this.onFontTimeOut();
            fontWatcher.start();
        }
    }

    /**
     * Callback when a FontWatcher sucessfully loads a font.
     *
     * @protected
     * @param {FontEvent} e FontEvent dispatched.
     */
    protected onFontComplete(): void {
        this._loaded++;
        this.onProgress.next(this._loaded)
        this.checkComplete();
    }

    /**
     * Callback when a FontWatcher fails to load a font.
     *
     * @protected
     * @param {FontEvent} e FontEvent dispatched.
     */
    protected onFontTimeOut(): void {
        this._failed++;
        this.checkComplete();
    }

    /**
     * Checks whether loading all files has completed and dispatches FontEvent.COMPLETE.
     *
     * @protected
     */
    protected checkComplete(): void {
        if (this._failed + this._loaded == this._assets.length) {
            this.onLoadComplete.next();
        }
    }
}
