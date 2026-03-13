import NPC from "../characters/NPC";
import Player from "../characters/Player";
import { State, StateManager } from "../utils/StateManager";
import Dialogue from "./Dialogue";
import  * as TitleAnimation  from "../gui/title/TitleAnimation";

export default class DialogueManager {
    public static actualDialogue: Dialogue
    public static npc: NPC

    public static startDialogue(player:Player, npc: NPC, dialogue: Dialogue) {
        this.npc = npc;
        this.actualDialogue = dialogue;
        this.actualDialogue.execute(player, npc);
        StateManager.state = State.DIALOG
    }

    public static continueDialogue(player: Player, npc: NPC, key: string) {
        if(this.actualDialogue == undefined)
            return;
        if(this.actualDialogue.nextDialogs[key] == undefined) {
            player.scene.activeCamera = player.playerCamera;
            this.closeDialogue();
            return;
        }

        this.actualDialogue = this.actualDialogue.getNextDialog(key);
        this.actualDialogue.execute(player, npc);
    }

    public static closeDialogue() {
        this.npc = undefined;
        this.actualDialogue = undefined
        StateManager.state = State.PLAYING
    }
}