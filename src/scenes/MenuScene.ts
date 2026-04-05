import { HemisphericLight, Vector3, FreeCamera, MeshBuilder,
         StandardMaterial, Color3, Color4, ActionManager,
         ExecuteCodeAction } from '@babylonjs/core';
import { Engine } from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';
import BaseScene from './BaseScene';

export default class MenuScene extends BaseScene {

    constructor(canvasElement: string, engine?: Engine) {
        super(canvasElement, engine, false);
    }

    async createScene(): Promise<void> {
        const camera = new FreeCamera("menuCam", new Vector3(0, 0, -10), this);
        camera.attachControl(this.canvas, true);
        this.light = new HemisphericLight('menuLight', new Vector3(0, 1, 0), this);
        this.clearColor = new Color4(0.12, 0.12, 0.18, 1);

        // GUI fullscreen — le texte flotte PAR DESSUS les cubes
        const ui = AdvancedDynamicTexture.CreateFullscreenUI("menuUI", true, this);

        // ===== BOUTON 1 — Jouer =====
        const btn1 = MeshBuilder.CreateBox("btn1", { width: 3, height: 1.5, depth: 0.3 }, this);
        btn1.position = new Vector3(-2.5, 0, 0);
        const mat1 = new StandardMaterial("mat1", this);
        mat1.diffuseColor = new Color3(0, 0.8, 1);
        mat1.emissiveColor = new Color3(0, 0.3, 0.5);
        btn1.material = mat1;

        btn1.actionManager = new ActionManager(this);
        btn1.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.onSwitchScene?.("game");
            })
        );

        // Texte lié au cube 1 (ne touche pas au material)
        const text1 = new TextBlock();
        text1.text = "JOUER";
        text1.color = "white";
        text1.fontSize = 32;
        text1.fontWeight = "bold";
        ui.addControl(text1);
        text1.linkWithMesh(btn1);  // le texte suit le cube

        // ===== BOUTON 2 — Bunker =====
        const btn2 = MeshBuilder.CreateBox("btn2", { width: 3, height: 1.5, depth: 0.3 }, this);
        btn2.position = new Vector3(2.5, 0, 0);
        const mat2 = new StandardMaterial("mat2", this);
        mat2.diffuseColor = new Color3(1, 0.4, 0);
        mat2.emissiveColor = new Color3(0.5, 0.15, 0);
        btn2.material = mat2;

        btn2.actionManager = new ActionManager(this);
        btn2.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                this.onSwitchScene?.("scene2");
            })
        );

        // Texte lié au cube 2
        const text2 = new TextBlock();
        text2.text = "BUNKER";
        text2.color = "white";
        text2.fontSize = 32;
        text2.fontWeight = "bold";
        ui.addControl(text2);
        text2.linkWithMesh(btn2);
    }
}