import { AbstractMesh, MeshBuilder, TransformNode, Scene, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui";
import Dialogue from "../dialogs/Dialogue";

export default class DialogueUI {
    private dialogPlane: AbstractMesh;
    private dialogTexture: AdvancedDynamicTexture;
    private verticalPanel: StackPanel;

    constructor(scene: Scene) {
        this.dialogPlane = MeshBuilder.CreatePlane("globalDialogPlane", { width: 4, height: 3 }, scene);
        this.dialogPlane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
        this.dialogPlane.isVisible = false; 

        this.dialogTexture = AdvancedDynamicTexture.CreateForMesh(this.dialogPlane, 1024, 768);

        this.verticalPanel = new StackPanel();
        this.verticalPanel.isVertical = true;
        this.dialogTexture.addControl(this.verticalPanel);
    }

    public attachTo(npcMesh: AbstractMesh) {
        this.dialogPlane.parent = npcMesh;
        this.dialogPlane.position = new Vector3(2, 1, 0); 
        this.dialogPlane.isVisible = true;
    }

    public hide() {
        this.dialogPlane.isVisible = false;
        this.dialogPlane.parent = null; 
        this.clearChoices();
    }

    private clearChoices() {
        this.verticalPanel.children.slice().forEach(child => {
            child.dispose();
        });
    }

    public renderChoices(choices: Record<string, Dialogue>) {
        this.clearChoices();

        for (const key in choices) {
            const nextDialog = choices[key];
            const row = this.createDialogOption(key, nextDialog.choiceText);
            this.verticalPanel.addControl(row);
        }
    }

    private createDialogOption(key: string, choice: string): StackPanel {
        const rowPanel = new StackPanel();
        rowPanel.isVertical = false;
        rowPanel.height = '160px';
        rowPanel.paddingBottom = "20px";

        const keyRect = new Rectangle("keyBox");
        keyRect.width = "140px";
        keyRect.height = "140px";
        keyRect.background = "rgba(255, 255, 255, 0.8)";
        keyRect.cornerRadius = 15;
        keyRect.color = "white";
        keyRect.thickness = 4;

        const keyText = new TextBlock();
        keyText.text = key.toUpperCase();
        keyText.color = "black";
        keyText.fontSize = 80;
        keyText.fontStyle = "bold";
        keyRect.addControl(keyText);

        rowPanel.addControl(keyRect);

        const textRect = new Rectangle("textBox");
        textRect.width = "700px";
        textRect.height = "140px";
        textRect.background = "rgba(20, 50, 150, 0.6)";
        textRect.cornerRadius = 20;
        textRect.color = "cyan";
        textRect.thickness = 4;
        textRect.paddingLeft = "20px";

        const textBlock = new TextBlock();
        textBlock.text = choice;
        textBlock.color = "white";
        textBlock.fontSize = 55;

        textRect.addControl(textBlock);
        rowPanel.addControl(textRect);

        return rowPanel;
    }
}