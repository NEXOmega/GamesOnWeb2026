import { AdvancedDynamicTexture, Rectangle, TextBlock, StackPanel, Control, Button } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import Dialogue from "../dialogs/Dialogue";

export default class DialogueUI {
    private texture: AdvancedDynamicTexture;
    public container: Rectangle; 
    private messageText: TextBlock;
    private choicesPanel: StackPanel;

    private typingTimer: any = null;
    public isTyping: boolean = false;
    private fullText: string = "";

    constructor(scene: Scene) {
        this.texture = AdvancedDynamicTexture.CreateFullscreenUI("DialogueUI");

        this.container = new Rectangle("MainContainer");
        this.container.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.container.width = "80%";
        this.container.height = "25%";
        this.container.top = "-20px";
        this.container.background = "rgba(0, 0, 0, 0.8)";
        this.container.color = "white";
        this.container.thickness = 2;
        this.container.cornerRadius = 10;
        this.container.isVisible = false; 
        this.texture.addControl(this.container);

        this.messageText = new TextBlock("Message");
        this.messageText.text = "";
        this.messageText.color = "white";
        this.messageText.fontSize = 24;
        this.messageText.textWrapping = true;
        this.messageText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.messageText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.messageText.paddingLeft = "30px";
        this.messageText.paddingTop = "30px";
        this.container.addControl(this.messageText);

        this.choicesPanel = new StackPanel("ChoicesPanel");
        this.choicesPanel.width = "300px";
        this.choicesPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.choicesPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.choicesPanel.paddingRight = "20px";
        this.choicesPanel.paddingBottom = "20px";
        this.container.addControl(this.choicesPanel);
    }

    public setMessage(text: string) {
        this.fullText = text;
        this.messageText.text = ""; 
        this.isTyping = true;

        if (this.typingTimer) clearInterval(this.typingTimer);

        let currentIndex = 0;
        const typingSpeed = 30; 

        this.typingTimer = setInterval(() => {
            this.messageText.text += this.fullText[currentIndex];
            currentIndex++;

            // Quand on a atteint la fin du texte
            if (currentIndex >= this.fullText.length) {
                this.finishTyping();
            }
        }, typingSpeed);
    }

    public finishTyping() {
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        this.messageText.text = this.fullText; 
        this.isTyping = false;
    }

    public show() {
        this.container.isVisible = true;
    }

    public hide() {
        this.container.isVisible = false;
    }

    public renderChoices(nextDialogs: Record<string, Dialogue>, onSelect: (key: string) => void) {
        this.choicesPanel.clearControls();

        const entries = Object.entries(nextDialogs);

        if (entries.length > 0) {
            for (const [key, dialog] of entries) {
                const displayText = `[${key.toUpperCase()}] ${dialog.choiceText}`;
                const btn = Button.CreateSimpleButton(`btn_${key}`, displayText);
                btn.height = "45px";
                btn.color = "white";
                btn.background = "rgba(40, 40, 40, 0.9)";
                btn.paddingBottom = "5px";
                btn.onPointerUpObservable.add(() => onSelect(key));
                this.choicesPanel.addControl(btn);
            }
        } 

        else {
            const btnClose = Button.CreateSimpleButton("btn_close", "[E] Quitter");
            btnClose.height = "45px";
            btnClose.color = "#ff7777";
            btnClose.background = "rgba(40, 40, 40, 0.9)";
            btnClose.onPointerUpObservable.add(() => onSelect("e")); 
            this.choicesPanel.addControl(btnClose);
        }
    }
}