import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {PixiComponent} from "./pixi.component";
import {ResizableDivDirective} from "./directive/ResizableDiv.directive";



@NgModule({
  declarations: [
    PixiComponent,
    ResizableDivDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PixiComponent,
    ResizableDivDirective
  ]
})
export class PIXIModule { }
