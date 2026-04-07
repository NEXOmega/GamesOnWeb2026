import Player from "../characters/Player";
import TitleRequest from "../gui/title/TitleRequest";
import {Action} from "./Action";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import DialogueManager from "../dialogs/DialogueManager";
import NPC from "../characters/NPC";
import { StateManager } from "../utils/StateManager";
import { Expose } from "class-transformer";

export default class RemoveItemFromInventory extends Action {
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