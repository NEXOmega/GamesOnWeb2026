import { Vector3, FreeCamera, Color4 } from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, StackPanel, Control, Rectangle } from "@babylonjs/gui";
import BaseScene from "./BaseScene";
import SceneManager from "./SceneManager";
import { StateManager, State } from "../utils/StateManager";

export default class IntroScene extends BaseScene {
    private uiTexture: AdvancedDynamicTexture;
    private scrollPanel: StackPanel;
    private skipText: TextBlock;
    private skipHandler: (ev: KeyboardEvent) => void;
    private isSkipping: boolean = false;

    async createScene(): Promise<void> {
        const camera = new FreeCamera("introCamera", new Vector3(0, 5, -10), this);
        this.activeCamera = camera;
        this.clearColor = new Color4(0.05, 0.05, 0.05, 1);

        StateManager.state = State.CINEMATIC;

        this.createUI();
        await this.loadLore("./assets/intro.json");
        
    }

    private createUI() {
        this.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("IntroUI", true, this);

        this.scrollPanel = new StackPanel("scrollPanel");
        this.scrollPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.scrollPanel.top = "800px";
        this.uiTexture.addControl(this.scrollPanel);

        this.skipText = new TextBlock("skipText", "Appuyez sur [ESPACE] pour passer...");
        this.skipText.color = "gray";
        this.skipText.fontSize = 20;
        this.skipText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.skipText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.skipText.paddingRight = "30px";
        this.skipText.paddingBottom = "30px";
        this.uiTexture.addControl(this.skipText);

        let alpha = 1;
        let fadeDir = -0.02;

        this.onBeforeRenderObservable.add(() => {
            if (this.isSkipping) return;

            alpha += fadeDir;
            if (alpha <= 0.2 || alpha >= 1) fadeDir *= -1;
            this.skipText.alpha = alpha;

            const currentTop = parseFloat(this.scrollPanel.top as string);
            this.scrollPanel.top = (currentTop - .4) + "px"; 
            if (currentTop < -2000) {
                this.startGame();
            }
        });

        this.skipHandler = (ev: KeyboardEvent) => {
            if (ev.code === "Space" || ev.code === "Enter" || ev.code === "Escape") {
                this.startGame();
            }
        };
        window.addEventListener("keydown", this.skipHandler);
    }

    private async loadLore(jsonPath: string) {
        try {
            const response = await fetch(jsonPath);
            const script = await response.json();

            script.lines.forEach((lineData: any) => {
                const txt = new TextBlock();
                txt.text = lineData.text || "";
                
                const rawSize = typeof lineData.size === "number" ? lineData.size : parseInt(lineData.size || "30");
                txt.fontSize = rawSize;
                txt.color = lineData.color || "white";
                txt.fontWeight = lineData.bold ? "bold" : "normal";
                
                txt.height = (rawSize + 30) + "px";
                txt.textWrapping = true;
                txt.paddingLeft = "15%";
                txt.paddingRight = "15%";
                
                this.scrollPanel.addControl(txt);
            });
        } catch (error) {
            console.error("Erreur chargement intro :", error);
            this.startGame(); // En cas d'erreur, on lance le jeu direct
        }
    }

    private startGame() {
        if (this.isSkipping) return;
        this.isSkipping = true;
        
        window.removeEventListener("keydown", this.skipHandler);
        
        SceneManager.changeScene("BunkerScene"); 
    }

    public dispose() {
        window.removeEventListener("keydown", this.skipHandler);
        if (this.uiTexture) this.uiTexture.dispose();
        super.dispose();
    }
}