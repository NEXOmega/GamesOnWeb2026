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

    // Barre de stamina
    private _staminaBarBg: Rectangle;
    private _staminaBarFill: Rectangle;
    private _staminaText: TextBlock;
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
        this.buildStaminaBar();
        this.buildRespawnButton();
    }

    private buildBarContainer(name: string, top: number): Rectangle {
        const container = new Rectangle(name);
        container.width = `${this.barWidth + 24}px`;
        container.height = `${this.barHeight + 24}px`;
        container.thickness = 0;
        container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        container.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        container.left = "16px";
        container.top = `${top}px`;
        this.ui.addControl(container);

        return container;
    }

    private buildHealthBar(): void {
        const container = this.buildBarContainer("healthBarContainer", 16);

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

    private buildStaminaBar(): void {
        const container = this.buildBarContainer("staminaBarContainer", 50);

        this._staminaBarBg = new Rectangle("staminaBarBg");
        this._staminaBarBg.width = `${this.barWidth}px`;
        this._staminaBarBg.height = `${this.barHeight}px`;
        this._staminaBarBg.background = "rgba(0, 0, 0, 0.55)";
        this._staminaBarBg.color = "white";
        this._staminaBarBg.thickness = 2;
        this._staminaBarBg.cornerRadius = 4;
        this._staminaBarBg.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._staminaBarBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        container.addControl(this._staminaBarBg);

        this._staminaBarFill = new Rectangle("staminaBarFill");
        this._staminaBarFill.width = `${this.barWidth - 4}px`;
        this._staminaBarFill.height = `${this.barHeight - 4}px`;
        this._staminaBarFill.background = "rgb(70, 160, 230)";
        this._staminaBarFill.thickness = 0;
        this._staminaBarFill.cornerRadius = 2;
        this._staminaBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._staminaBarFill.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._staminaBarFill.left = "2px";
        this._staminaBarBg.addControl(this._staminaBarFill);

        this._staminaText = new TextBlock("staminaText");
        this._staminaText.text = "100 / 100";
        this._staminaText.color = "white";
        this._staminaText.fontSize = 14;
        this._staminaText.fontWeight = "bold";
        this._staminaText.outlineColor = "black";
        this._staminaText.outlineWidth = 2;
        this._staminaBarBg.addControl(this._staminaText);
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

    public updateStaminaBar(current: number, max: number): void {
        if (!this._staminaBarFill || !this._staminaText) return;

        const ratio = Math.max(0, Math.min(1, current / max));
        const fillWidth = Math.max(0, (this.barWidth - 4) * ratio);
        this._staminaBarFill.width = `${fillWidth}px`;
        this._staminaText.text = `${Math.round(current)} / ${max}`;

        if (ratio > 0.3) {
            this._staminaBarFill.background = "rgb(70, 160, 230)";
        } else {
            this._staminaBarFill.background = "rgb(220, 180, 45)";
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
