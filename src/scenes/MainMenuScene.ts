import { Color4,FreeCamera, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, StackPanel, TextBlock } from "@babylonjs/gui";

import BaseScene from "./BaseScene";
import SceneManager from "./SceneManager";

export default class MainMenuScene extends BaseScene {
    private uiTexture: AdvancedDynamicTexture | null = null;

    async createScene(): Promise<void> {
        this.clearColor = new Color4(0.1, 0.1, 0.15, 1);

        const camera = new FreeCamera("menuCamera", new Vector3(0, 5, -10), this);
        camera.setTarget(Vector3.Zero());
        this.activeCamera = camera;

        this.createUI();
    }

    private createUI() {
        this.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("MenuUI", true, this);

        const panel = new StackPanel();
        panel.width = "400px";
        panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this.uiTexture.addControl(panel);

        const title = new TextBlock("title", "NOM DU JEU");
        title.height = "100px";
        title.color = "white";
        title.fontSize = 48;
        title.fontWeight = "bold";
        panel.addControl(title);

        const playBtn = Button.CreateSimpleButton("playBtn", "JOUER");
        this.styleMenuButton(playBtn);
        playBtn.onPointerUpObservable.add(() => {
            console.log("Lancement du jeu...");
            SceneManager.changeScene("BunkerScene"); 
        });
        panel.addControl(playBtn);

        const optionsBtn = Button.CreateSimpleButton("optionsBtn", "OPTIONS");
        this.styleMenuButton(optionsBtn);
        optionsBtn.onPointerUpObservable.add(() => {
            this.optionsHud.toggle();
        });
        panel.addControl(optionsBtn);
    }

    private styleMenuButton(btn: Button) {
        btn.width = "300px";
        btn.height = "60px";
        btn.color = "white";
        btn.background = "rgba(50, 50, 50, 0.8)";
        btn.thickness = 2;
        btn.cornerRadius = 10;
        btn.paddingBottom = "15px";
        
        btn.onPointerEnterObservable.add(() => btn.background = "rgba(100, 100, 100, 0.9)");
        btn.onPointerOutObservable.add(() => btn.background = "rgba(50, 50, 50, 0.8)");
    }

    public dispose() {
        if (this.uiTexture) {
            this.uiTexture.dispose();
        }
        super.dispose();
    }
}