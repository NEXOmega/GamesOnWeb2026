import 'reflect-metadata';
import { Expose } from "class-transformer";
import Player from "../characters/Player";
import { StateManager } from "../utils/StateManager";
import ClearDialog from "./ClearDialogAction";
import DialogueManager from "../dialogs/DialogueManager";

import * as TitleAnimation from '../gui/title/TitleAnimation';
import { Vector3 } from "@babylonjs/core";
import { TransformVector3 } from '../utils/json/Decorators';

export const ALL_ACTIONS: { value: any, name: string }[] = [];

export class Action {
    readonly type: string;
    public execute(player: Player) {

    }
}

export class AddItemToInventory extends Action {
    readonly type = "AddItemToInventory";

    @Expose()
    private itemId: string

    @Expose()
    private quantity: number

    constructor(itemId: string, quantity: number) {
        super();
        this.itemId = itemId;
        this.quantity = quantity;
    }

    public execute(player: Player) {
        StateManager.inventory.addItem(this.itemId, this.quantity);
    }
}

export class TeleportAction extends Action {
    readonly type = "TeleportAction";

    @TransformVector3()
    public position: Vector3;
    
    @TransformVector3()
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
        console.log(`Teleported player to ${this.position.x}, ${this.position.y}, ${this.position.z}`)
    }
}

ALL_ACTIONS.push({ value: AddItemToInventory, name: "AddItemToInventory" });
ALL_ACTIONS.push({value: TeleportAction, name: "TeleportAction"})