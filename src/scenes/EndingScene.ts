import { FreeCamera,Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Control, Image, Rectangle,StackPanel, TextBlock } from "@babylonjs/gui";

import { State,StateManager } from "../utils/StateManager";
import BaseScene from "./BaseScene";
import SceneManager from "./SceneManager";

interface BgTrigger {
    scrollThreshold: number;
    src: string;
    triggered: boolean;
}

export default class EndingScene extends BaseScene {
    private uiTexture: AdvancedDynamicTexture;
    private scrollPanel: StackPanel;
    
    private bgLayer1: Image;
    private bgLayer2: Image;
    private currentBg: Image;

    private bgTriggers: BgTrigger[] = [];
    private currentTotalHeight: number = 0;

    async createScene(): Promise<void> {
        const camera = new FreeCamera("endingCamera", new Vector3(0, 5, -10), this);
        this.activeCamera = camera;
        StateManager.state = State.CINEMATIC;

        this.createBaseUI();
        await this.loadAndGenerateEnding("./assets/ending.json");
    }

    private createBaseUI() {
        this.uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("EndingUI", true, this);

        this.bgLayer1 = new Image("bg1");
        this.bgLayer1.stretch = Image.STRETCH_FILL;
        this.bgLayer1.alpha = 0;
        this.uiTexture.addControl(this.bgLayer1);

        this.bgLayer2 = new Image("bg2");
        this.bgLayer2.stretch = Image.STRETCH_FILL;
        this.bgLayer2.alpha = 0;
        this.uiTexture.addControl(this.bgLayer2);

        this.currentBg = this.bgLayer1;

        const overlay = new Rectangle("overlay");
        overlay.background = "rgba(0,0,0,0.7)";
        overlay.thickness = 0;
        this.uiTexture.addControl(overlay);

        this.scrollPanel = new StackPanel("scrollPanel");
        this.scrollPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.scrollPanel.top = "800px";
        this.uiTexture.addControl(this.scrollPanel);

        this.onBeforeRenderObservable.add(() => {
            const scrollPos = parseFloat(this.scrollPanel.top as string);
            this.scrollPanel.top = (scrollPos - 0.8) + "px";

            const traveledDistance = 800 - scrollPos;
            
            const triggerOffset = 4000; 

            this.bgTriggers.forEach(trigger => {
                if (!trigger.triggered && (traveledDistance + triggerOffset) >= trigger.scrollThreshold) {
                    this.changeBackgroundSmoothly(trigger.src);
                    trigger.triggered = true;
                }
            });

            // Gestion du fondu smooth (sécurisé entre 0 et 1)
            if (this.currentBg === this.bgLayer1 && this.bgLayer1.alpha < 1) {
                this.bgLayer1.alpha = Math.min(1, this.bgLayer1.alpha + 0.01);
                this.bgLayer2.alpha = Math.max(0, this.bgLayer2.alpha - 0.01);
            } else if (this.currentBg === this.bgLayer2 && this.bgLayer2.alpha < 1) {
                this.bgLayer2.alpha = Math.min(1, this.bgLayer2.alpha + 0.01);
                this.bgLayer1.alpha = Math.max(0, this.bgLayer1.alpha - 0.01);
            }

            if (scrollPos < -4000) this.returnToMenu();
        });
    }

    private async loadAndGenerateEnding(jsonPath: string) {
        const response = await fetch(jsonPath);
        const script = await response.json();

        // Background de départ
        if (script.background_initial) {
            this.bgLayer1.source = script.background_initial;
            this.bgLayer1.alpha = 1;
        }

        script.content.forEach((block: any) => {
            if (this.checkConditions(block.conditions)) {
                block.lines.forEach((line: any) => {
                    this.addTextLine(line);
                });
            }
        });
    }

    private addTextLine(lineData: any) {
        const txt = new TextBlock();
        txt.text = lineData.text || "";
        
        const rawSize = typeof lineData.size === "number" ? lineData.size : parseInt(lineData.size || "30");
        
        txt.fontSize = rawSize;
        txt.color = lineData.color || "white";
        txt.fontWeight = lineData.bold ? "bold" : "normal";
        
        const lineHeight = rawSize + 30;
        txt.height = lineHeight + "px";
        txt.textWrapping = true;
        txt.paddingLeft = "10%";
        txt.paddingRight = "10%";

        if (lineData.trigger_bg) {
            this.bgTriggers.push({
                scrollThreshold: this.currentTotalHeight, 
                src: lineData.trigger_bg,
                triggered: false
            });
        }

        this.scrollPanel.addControl(txt);
        this.currentTotalHeight += lineHeight; 
    }

    private changeBackgroundSmoothly(src: string) {
        const nextBg = (this.currentBg === this.bgLayer1) ? this.bgLayer2 : this.bgLayer1;
        nextBg.source = src;
        nextBg.alpha = 0;
        this.currentBg = nextBg;
    }

    private checkConditions(conditions: any[]): boolean {
        if (!conditions || conditions.length === 0) return true;
        return conditions.every(cond => (StateManager.getFlag(cond.flag) || false) === cond.value);
    }

    private returnToMenu() { SceneManager.changeScene("MainMenu"); }
}