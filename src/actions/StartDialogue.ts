import { Expose } from "class-transformer";
import NPC from "../characters/NPC";
import Player from "../characters/Player";
import Dialogue from "../dialogs/Dialogue";
import DialogueManager from "../dialogs/DialogueManager";
import { State, StateManager } from "../utils/StateManager";
import {Action} from "./Action";

export default class StartDialogueAction extends Action {
    readonly type = "StartDialogueAction";

    private npc: NPC;
    @Expose()
    private dialog: Dialogue;

    constructor(npc: NPC, dialogue: Dialogue) {
        super();
        this.npc = npc;
        this.dialog = dialogue;
    }

    public execute(player: Player) {

        if (StateManager.state !== State.DIALOG) {
            DialogueManager.startDialogue(player, this.npc, this.dialog);
        }
    }
}