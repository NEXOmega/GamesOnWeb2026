import { Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Rectangle, Slider,StackPanel, TextBlock } from "@babylonjs/gui";

import SoundManager from "../sounds/SoundManager";
import { State, StateManager } from "../utils/StateManager";

export default class OptionsHUD {
    private texture: AdvancedDynamicTexture;
    private mainContainer: Rectangle;
    private isVisible: boolean = false;
    private scene: Scene;
    private previousState: State = State.PLAYING;

    constructor(scene: Scene) {
        this.scene = scene;

        this.texture = AdvancedDynamicTexture.CreateFullscreenUI("OptionsHUD", true, scene);

        this.mainContainer = new Rectangle("OptionsContainer");
        this.mainContainer.width = "600px";
        this.mainContainer.height = "520px";
        this.mainContainer.background = "rgba(20, 20, 20, 0.95)";
        this.mainContainer.color = "cyan";
        this.mainContainer.thickness = 2;
        this.mainContainer.cornerRadius = 10;
        this.mainContainer.isVisible = this.isVisible;
        this.texture.addControl(this.mainContainer);

        const stack = new StackPanel();
        stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stack.paddingTop = "20px";
        stack.spacing = 15;
        this.mainContainer.addControl(stack);

        const title = new TextBlock("optTitle", "⚙️ PARAMÈTRES");
        title.height = "50px";
        title.color = "white";
        title.fontSize = 32;
        title.fontWeight = "bold";
        stack.addControl(title);

        const audioLabel = new TextBlock("audioLabel", "Volume Global");
        audioLabel.height = "30px";
        audioLabel.color = "gray";
        audioLabel.fontSize = 20;
        stack.addControl(audioLabel);

        const volumeSlider = new Slider();
        volumeSlider.minimum = 0;
        volumeSlider.maximum = 1;
        volumeSlider.value = SoundManager.getGlobalVolume();
        volumeSlider.height = "20px";
        volumeSlider.width = "250px";
        volumeSlider.color = "cyan";
        volumeSlider.background = "gray";
        volumeSlider.onValueChangedObservable.add((value) => {
            SoundManager.setGlobalVolume(value);
        });
        stack.addControl(volumeSlider);

        const ctrlLabel = new TextBlock("ctrlLabel", "Contrôles (Touche principale)");
        ctrlLabel.height = "30px";
        ctrlLabel.color = "gray";
        ctrlLabel.fontSize = 20;
        ctrlLabel.paddingTop = "10px";
        stack.addControl(ctrlLabel);

        const closeBtn = Button.CreateSimpleButton("closeBtn", "APPLIQUER & FERMER");
        closeBtn.width = "250px";
        closeBtn.height = "45px";
        closeBtn.color = "white";
        closeBtn.background = "rgba(50, 50, 50, 0.8)";
        closeBtn.cornerRadius = 5;
        closeBtn.paddingTop = "10px";
        closeBtn.onPointerUpObservable.add(() => {
            this.toggle();
        });
        stack.addControl(closeBtn);
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.mainContainer.isVisible = this.isVisible;

        if (this.isVisible) {
            this.previousState = StateManager.state;
            StateManager.state = State.IN_INVENTORY; 
            document.exitPointerLock(); 
        } else {
            StateManager.state = this.previousState;
        }
    }

    public dispose() {
        this.texture.dispose();
    }
}