import Player from "../characters/Player";
import TitleRequest from "../gui/title/TitleRequest";
import Action from "./Action";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import DialogueManager from "../dialogs/DialogueManager";
import NPC from "../characters/NPC";
import { StateManager } from "../utils/StateManager";

export default class RemoveItemFromInventory extends Action {
    private itemId: string
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