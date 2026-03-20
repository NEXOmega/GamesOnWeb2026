import NPC from "../characters/NPC";
import Player from "../characters/Player";
import { State, StateManager } from "../utils/StateManager";
import Dialogue from "./Dialogue";
import  * as TitleAnimation  from "../gui/title/TitleAnimation";
import InputManager from "../utils/InputManager";

export default class DialogueManager {
    public static actualDialogue: Dialogue
    public static npc: NPC

    public static init() {
        InputManager.onAnyKeyPressed.add((pressedKey) => {
            if (StateManager.state !== State.DIALOG) return;

            const currentDialogue = DialogueManager.actualDialogue;
            if (!currentDialogue) return;

            if (!currentDialogue.canChooseNextChoice) return;

            const nextNode = currentDialogue.getNextDialog(pressedKey.toLowerCase());

            if (nextNode) {
                const player = StateManager.actualPlayer;
                const npc = DialogueManager.npc; 

                DialogueManager.actualDialogue = nextNode;

                nextNode.execute(player, npc);
            } else if (Object.keys(currentDialogue.nextDialogs).length === 0) {
                
                if (pressedKey.toLowerCase() === "e" || pressedKey.toLowerCase() === "escape") {
                    DialogueManager.closeDialogue();
                }
            }
        });
    }

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
            player.playerHud.dialog.enqueueFront({
                            text: "",
                            animation: new TitleAnimation.FadeAnimation(1,1,0)
                        })
            return;
        }

        this.actualDialogue = this.actualDialogue.getNextDialog(key);
        this.actualDialogue.execute(player, npc);
    }

    public static closeDialogue() {
        this.npc.dialogPane.visibility = 0;
        this.npc = undefined;
        this.actualDialogue = undefined
        StateManager.state = State.PLAYING
    }
}