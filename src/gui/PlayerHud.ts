import { AdvancedDynamicTexture, Button, Control, Rectangle, TextBlock } from "@babylonjs/gui";
import Tickable from "../utils/Tickable";
import { TitleController } from "./title/TitleController";
import * as TitleAnimation from "./title/TitleAnimation";

export default class PlayerHud implements Tickable {
    ui: AdvancedDynamicTexture;

    public title: TitleController;
    public dialog: TitleController;

    // Barre de vie
    private _healthBarBg: Rectangle;
    private _healthBarFill: Rectangle;
    private _healthText: TextBlock;
    private readonly barWidth: number = 240;
    private readonly barHeight: number = 22;

    // Bouton respawn (mort)
    private _respawnButton: Button;

    constructor() {
        this.ui = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        this.title = new TitleController(this.ui);
        this.dialog = new TitleController(this.ui);

        this.dialog.text.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.dialog.text.height = "100px";
        this.dialog.text.paddingBottom = "40px";

        this.buildHealthBar();
        this.buildRespawnButton();
    }

    private buildHealthBar(): void {
        const container = new Rectangle("healthBarContainer");
        container.width = `${this.barWidth + 24}px`;
        container.height = `${this.barHeight + 24}px`;
        container.thickness = 0;
        container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.left = "16px";
        container.top = "16px";
        this.ui.addControl(container);

        this._healthBarBg = new Rectangle("healthBarBg");
        this._healthBarBg.width = `${this.barWidth}px`;
        this._healthBarBg.height = `${this.barHeight}px`;
        this._healthBarBg.background = "rgba(0, 0, 0, 0.55)";
        this._healthBarBg.color = "white";
        this._healthBarBg.thickness = 2;
        this._healthBarBg.cornerRadius = 4;
        this._healthBarBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._healthBarBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        container.addControl(this._healthBarBg);

        this._healthBarFill = new Rectangle("healthBarFill");
        this._healthBarFill.width = `${this.barWidth - 4}px`;
        this._healthBarFill.height = `${this.barHeight - 4}px`;
        this._healthBarFill.background = "rgb(60, 180, 60)";
        this._healthBarFill.thickness = 0;
        this._healthBarFill.cornerRadius = 2;
        this._healthBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._healthBarFill.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._healthBarFill.left = "2px";
        this._healthBarBg.addControl(this._healthBarFill);

        this._healthText = new TextBlock("healthText");
        this._healthText.text = "100 / 100";
        this._healthText.color = "white";
        this._healthText.fontSize = 14;
        this._healthText.fontWeight = "bold";
        this._healthText.outlineColor = "black";
        this._healthText.outlineWidth = 2;
        this._healthBarBg.addControl(this._healthText);
    }

    private buildRespawnButton(): void {
        this._respawnButton = Button.CreateSimpleButton("respawnButton", "Respawn");
        this._respawnButton.width = "240px";
        this._respawnButton.height = "60px";
        this._respawnButton.color = "white";
        this._respawnButton.background = "rgb(60, 130, 200)";
        this._respawnButton.cornerRadius = 8;
        this._respawnButton.thickness = 2;
        this._respawnButton.fontSize = 22;
        this._respawnButton.fontWeight = "bold";
        this._respawnButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._respawnButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._respawnButton.top = "60px";
        this._respawnButton.isVisible = false;

        this._respawnButton.pointerEnterAnimation = () => {
            this._respawnButton.background = "rgb(90, 160, 230)";
        };
        this._respawnButton.pointerOutAnimation = () => {
            this._respawnButton.background = "rgb(60, 130, 200)";
        };

        this.ui.addControl(this._respawnButton);
    }

    public updateHealthBar(current: number, max: number): void {
        if (!this._healthBarFill || !this._healthText) return;

        const ratio = Math.max(0, Math.min(1, current / max));
        const fillWidth = Math.max(0, (this.barWidth - 4) * ratio);
        this._healthBarFill.width = `${fillWidth}px`;
        this._healthText.text = `${Math.round(current)} / ${max}`;

        if (ratio > 0.6) {
            this._healthBarFill.background = "rgb(60, 180, 60)";
        } else if (ratio > 0.3) {
            this._healthBarFill.background = "rgb(220, 150, 30)";
        } else {
            this._healthBarFill.background = "rgb(200, 30, 30)";
        }
    }

    /**
     * Affiche le bouton Respawn et branche le callback de clic.
     */
    public showRespawnButton(onRespawn: () => void): void {
        if (!this._respawnButton) return;
        this._respawnButton.onPointerClickObservable.clear();
        this._respawnButton.onPointerClickObservable.add(() => onRespawn());
        this._respawnButton.isVisible = true;
    }

    public hideRespawnButton(): void {
        if (!this._respawnButton) return;
        this._respawnButton.isVisible = false;
        this._respawnButton.onPointerClickObservable.clear();
    }

    update(deltaTime: number): void {
        this.title.update();
        this.dialog.update();
    }
}