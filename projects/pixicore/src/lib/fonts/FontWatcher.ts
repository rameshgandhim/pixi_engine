import {FontRuler} from "./FontRuler";

export interface IFontWatcherListener {
    onLoadComplete(): void;

    onLoadTimeout(): void;
}

/**
 * @class FontWatcher
 * @classdesc Monitors document to verify if a font has been loaded
 */
export class FontWatcher {
    private activeCallback?: () => void;
    private inactiveCallback?: () => void;
    private fontName: string;
    private fontTestString: string;

    private fontRulerFallbackSerif?: FontRuler;
    private fontRulerFallbackSansSerif?: FontRuler;

    private fontRulerSerif: FontRuler;
    private fontRulerSansSerif: FontRuler;

    private timeout: number;
    private started: number = 0;

    private serif: string = "serif";
    private sansSerif: string = "sans-serif";

    public onComplete?: () => void;
    public onTimeout?: () => void;
    /**
     * Default test string. Characters are chosen so that their widths vary a lot
     * between the fonts in the default stacks. We want each fallback stack
     * to always start out at a different width than the other.
     */
    private defaultFontTestString = 'BESbswy';


    constructor(fontName: string, timeout: number) {
        this.fontName = fontName;
        this.fontTestString = this.defaultFontTestString;
        this.timeout = timeout;
        this.fontRulerSerif = new FontRuler(this.fontTestString, this.serif);
        this.fontRulerSansSerif = new FontRuler(this.fontTestString, this.sansSerif);
    }

    getTime(): number {
        if (performance) {
            return performance.now()
        } else {
            return Date.now()
        }
    }

    /*
    * Starts watching the font loading
    */
    public start(): void {
        this.fontRulerFallbackSerif = new FontRuler(this.fontTestString, this.fontName + ',' + this.serif);
        this.fontRulerFallbackSansSerif = new FontRuler(this.fontTestString, this.fontName + ',' + this.sansSerif);

        this.started = this.getTime();

        this.asyncCheck();
    }

    /**
     * Returns true if the loading has timed out.
     */
    private hasTimedOut(): Boolean {
        return this.getTime() - this.started >= this.timeout;
    }

    /**
     * Returns true if both fonts match the normal fallback fonts.
     *
     */
    private isFallbackFont(): Boolean {
        var widthFallbackSerif: number = this.fontRulerFallbackSerif?.getWidth() ?? 0;
        var widthFallbackSansSerif: number = this.fontRulerFallbackSansSerif?.getWidth() ?? 0;
        var widthSerif: number = this.fontRulerSerif.getWidth();
        var widthSansSerif: number = this.fontRulerSansSerif.getWidth();
        return widthFallbackSerif === widthSerif && widthFallbackSansSerif === widthSansSerif;
    }


    /**
     * Checks the width of the two spans against their original widths during each
     * async loop. If the width of one of the spans is different than the original
     * width, then we know that the font is rendering and finish with the active
     * callback. If we wait more than 5 seconds and nothing has changed, we finish
     * with the inactive callback.
     *
     */
    private check(): void {
        if (this.isFallbackFont()) {
            if (this.hasTimedOut()) {
                if (this.onTimeout) {
                    this.onTimeout()
                }
            } else {
                this.asyncCheck();
            }
        } else {
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    private asyncCheck() {
        window.setTimeout(() => {
            this.check();
        }, 25);
    }
}
