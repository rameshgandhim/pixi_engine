import { Component, OnInit, ViewChild } from "@angular/core";
import { PixiComponent } from "./pixi.component";
import { WidgetDataComponent } from "@sg/shared";
import { Type } from "./elements/PixiElementRegistry";
import { ServiceInstance } from "./elements/PixiManager";

@Component({
    selector: "game",
    template: `
    `,
    styles: [
        `
        `
    ]
})
export class GameComponent extends WidgetDataComponent implements OnInit {
    _stage?: PixiComponent | undefined;

    get stage(): PixiComponent | undefined {
        return this._stage;
    }

    services: ServiceInstance[] = [];

    @ViewChild(PixiComponent) set stage(comp: PixiComponent | undefined) {
        this._stage = comp;

        if (this._stage) {
            this.subscribe(this._stage.managerReady, _ => this.onManagerReady())
            this.subscribe(this._stage.onLoaded, _ => this.onLoaded())
        }
    }

    private onManagerReady(){
        if (this._stage) {
            for (const s of this.services) {
                this._stage.manager?.addService(s.type, s.instance)
            }
        }
    }

    private onLoaded(){
    }

    protected addService(type: Type<unknown>, instance: any) {
        this.services.push({
            type, instance
        })
    }

    ngOnInit() {
        super.ngOnInit();

    }
}