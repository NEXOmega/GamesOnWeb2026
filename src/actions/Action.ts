import 'reflect-metadata';
import { Expose } from "class-transformer";
import Player from "../characters/Player";
import { State, StateManager } from "../utils/StateManager";
import DialogueManager from "../dialogs/DialogueManager";

import * as TitleAnimation from '../gui/title/TitleAnimation';
import { Vector3 } from "@babylonjs/core";
import { TransformVector3 } from '../utils/json/Decorators';
import NPC from '../characters/NPC';
import { FadeAnimation } from '../gui/title/TitleAnimation';
import Entity from '../entities/Entity';
import Dialogue from '../dialogs/Dialogue';

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

export class CloseDialogueAction extends Action {
    readonly type = "CloseDialogueAction";

    @Expose()
    private npcId: string;

    constructor(npcId: string) {
        super();
        this.npcId = npcId;
    }

    public execute(player: Player) {
        const npc : NPC = player.scene.entityManager.getEntityById(this.npcId) as NPC;
        if(npc == undefined)
            throw new Error("Invalid NPC !")
        
        if(DialogueManager.npc != npc)
            return;

        player.playerHud.dialog.enqueueFront({
                        text: "",
                        animation: new TitleAnimation.FadeAnimation(1,1,0)
                    })            
        DialogueManager.closeDialogue();
    }
}

export class ClearDialog extends Action {
    readonly type = "ClearDialogue";
    constructor() {
        super();
    }

    public execute(player: Player) {
        player.playerHud.dialog.enqueue({ text: "", animation: new FadeAnimation(0,0,0) });
    }
}

export class ConsoleLogAction extends Action {
    readonly type = "ConsoleLogAction";

    @Expose()
    private message: String;

    constructor(message: String) {
        super();
        this.message = message;
    }

    public execute(player: Player) {
        console.log(this.message);
    }
}

export class RemoveEntityFromScene extends Action {
    readonly type = "RemvoeEntityFromScene";

    private entityId: string;

    constructor(entityId: string) {
        super();
        this.entityId = entityId;
    }

    public execute(player: Player) {
        console.log("Disposing of : " + this.entityId)
        const entity : Entity = player.scene.entityManager.getEntityById(this.entityId);
        entity.dispose();
    }
}

export class RemoveItemFromInventory extends Action {
    readonly type = "RemoveItemFromInventory";

    @Expose()
    private itemId: string
    @Expose()
    private quantity: number

    constructor(itemId: string, quantity: number = 1) {
        super();
        this.itemId = itemId;
        this.quantity = quantity;
    }

    public execute(player: Player) {
        StateManager.inventory.removeItem(this.itemId, this.quantity);
    }
}

export class StartDialogueAction extends Action {
    readonly type = "StartDialogueAction";

    @Expose()
    private npcId: string;
    @Expose()
    private dialogId: string;

    constructor(npcId: string, dialogId: string) {
        super();
        this.npcId = npcId;
        this.dialogId = dialogId;
    }

    public execute(player: Player) {
        const npc : NPC = player.scene.entityManager.getEntityById(this.npcId) as NPC;
        
        if (StateManager.state !== State.DIALOG) {
            DialogueManager.startDialogue(player, npc, this.dialogId);
        }
    }
}

ALL_ACTIONS.push({ value: AddItemToInventory, name: "AddItemToInventory" });
ALL_ACTIONS.push({value: TeleportAction, name: "TeleportAction"})
ALL_ACTIONS.push({value: CloseDialogueAction, name: "CloseDialogueAction"})
ALL_ACTIONS.push({value: ClearDialog, name: "ClearDialogue"})
ALL_ACTIONS.push({value: ConsoleLogAction, name: "ConsoleLogAction"})
ALL_ACTIONS.push({value: RemoveItemFromInventory, name: "RemoveItemFromInventory"})