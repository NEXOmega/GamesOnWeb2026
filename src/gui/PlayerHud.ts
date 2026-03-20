import { AdvancedDynamicTexture, Control, TextBlock } from "@babylonjs/gui";
import Tickable from "../utils/Tickable";
import { TitleController } from "./title/TitleController";
import * as TitleAnimation from "./title/TitleAnimation";

export default class PlayerHud implements Tickable {
    ui: AdvancedDynamicTexture;
    
    public title: TitleController;
    public dialog: TitleController;

    constructor() {
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.title = new TitleController(this.ui);
        this.dialog = new TitleController(this.ui);

        this.dialog.text.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM
        this.dialog.text.height = "100px";
        this.dialog.text.paddingBottom = "40px";

    }
    update(deltaTime: number): void {
        this.title.update();
        this.dialog.update();
    }
}