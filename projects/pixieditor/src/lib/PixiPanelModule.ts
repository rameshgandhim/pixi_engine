import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PixiPanelComponent } from "./components/PixiPanel.component";
import { PixiToolbarComponent } from "./components/PixiToolbar/PixiToolbar.component";
import { FormsModule } from "@angular/forms";
import { PixiSplitViewComponent, SplitPaneDirective } from "./components/PixiSplitView.component";
import { PixiDetailViewComponent } from "./components/PixiToolbar/PixiDetailView.component";
import { PixiDetailValueComponent } from "./components/PixiDetailValue.component";
import { PixiTreeViewComponent } from "./components/PixiTreeView.component";
import { PixiToggleComponent } from "./components/PixiToggle.component";
import { PixiEditorComponent } from './components/PixiEditor.component';

@NgModule({
    declarations: [
        PixiPanelComponent,
        PixiToolbarComponent,
        PixiSplitViewComponent,
        PixiDetailViewComponent,
        PixiDetailValueComponent,
        PixiTreeViewComponent,
        PixiToggleComponent,
        SplitPaneDirective,
        PixiEditorComponent
    ],
    exports: [
        PixiPanelComponent,
        PixiEditorComponent
    ],
    imports: [
        CommonModule,
        FormsModule
    ]
})
export class PixiPanelModule {
}
