import { HemisphericLight, Vector3, FreeCamera, MeshBuilder,
         StandardMaterial, Color3, ActionManager,
         ExecuteCodeAction } from '@babylonjs/core';
import { Engine } from '@babylonjs/core';
import BaseScene from './BaseScene';
import SceneManager from './SceneManager';

export default class MenuScene extends BaseScene {

    async createScene(): Promise<void> {
        const camera = new FreeCamera("menuCam", new Vector3(0, 0, -10), this);
        camera.attachControl(this.canvas, true);
        this.light = new HemisphericLight('menuLight', new Vector3(0, 1, 0), this);

        // ===== BOUTON 1 — Scène principale =====
        const btn1 = MeshBuilder.CreateBox("btn1", { width: 3, height: 1.5, depth: 0.3 }, this);
        btn1.position = new Vector3(-2.5, 0, 0); // à gauche
        const mat1 = new StandardMaterial("mat1", this);
        mat1.diffuseColor = new Color3(0, 0.8, 1);
        mat1.emissiveColor = new Color3(0, 0.3, 0.5);
        btn1.material = mat1;

        btn1.actionManager = new ActionManager(this);
        btn1.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                SceneManager.changeScene("game")
            })
        );

        // ===== BOUTON 2 — Autre scène =====
        const btn2 = MeshBuilder.CreateBox("btn2", { width: 3, height: 1.5, depth: 0.3 }, this);
        btn2.position = new Vector3(2.5, 0, 0); // à droite
        const mat2 = new StandardMaterial("mat2", this);
        mat2.diffuseColor = new Color3(1, 0.4, 0);
        mat2.emissiveColor = new Color3(0.5, 0.15, 0);
        btn2.material = mat2;

        btn2.actionManager = new ActionManager(this);
        btn2.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                SceneManager.changeScene("bunker")
            })
        );
    }
}