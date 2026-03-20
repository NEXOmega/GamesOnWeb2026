import { Vector3 } from "@babylonjs/core";
import Action from "./Action";
import Player from "../characters/Player";
import DialogueManager from "../dialogs/DialogueManager";

import * as TitleAnimation from '../gui/title/TitleAnimation';

export default class DialogAction extends Action {
    public position: Vector3;
    public rotation: Vector3;

    constructor(position: Vector3, rotation: Vector3) {
        super();
        this.position = position;
        this.rotation = rotation;
    }

    public execute(player: Player): void {
        player.setPosition(this.position);
        player.setRotation(this.rotation);
        player.scene.activeCamera = player.playerCamera;
        DialogueManager.closeDialogue()
        player.playerHud.dialog.enqueueFront({
            text: "",
            animation: new TitleAnimation.FadeAnimation(1,1,0)
        })
    }
}