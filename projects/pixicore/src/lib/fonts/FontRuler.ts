export class FontRuler {
    private fontTestString: string;
    private ctx: CanvasRenderingContext2D | null;

    constructor(fontTestString: string, fontName: string) {
        this.fontTestString = fontTestString;
        var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
        if (this.ctx) {
            this.ctx.font = "300px " + fontName;
        }
    }

    public getWidth(): number {
        return this.ctx?.measureText(this.fontTestString).width ?? 0;
    }
}
