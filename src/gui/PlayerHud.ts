import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import Tickable from "../utils/Tickable";
import { TitleController } from "./title/TitleController";
import * as TitleAnimation from "./title/TitleAnimation";

export default class PlayerHud implements Tickable {
    ui: AdvancedDynamicTexture;
    
    public title: TitleController;

    constructor() {
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.title = new TitleController(this.ui);

    }
    update(deltaTime: number): void {
        this.title.update();
    }
}