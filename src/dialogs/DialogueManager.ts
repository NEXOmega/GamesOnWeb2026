import NPC from "../characters/NPC";
import Player from "../characters/Player";
import { State, StateManager } from "../utils/StateManager";
import Dialogue from "./Dialogue";
import InputManager from "../utils/InputManager";
import DialogueUI from "../gui/DialogueUI";
import { Scene } from "@babylonjs/core";
import * as TitleAnimation from  "../gui/title/TitleAnimation";

export default class DialogueManager {
    public static actualDialogue: Dialogue | null = null;
    public static npc: NPC | null = null;
    
    public static ui: DialogueUI;

    public static init(scene: Scene) {
        this.ui = new DialogueUI(scene);
        InputManager.onAnyKeyPressed.add((pressedKey) => {
            if (StateManager.state !== State.DIALOG || !this.actualDialogue) return;
            if (!this.actualDialogue.canChooseNextChoice) return;

            const nextNode = this.actualDialogue.getNextDialog(pressedKey);

            if (nextNode) {
                this.goToDialogue(nextNode);
            } else if (Object.keys(this.actualDialogue.nextDialogs).length === 0) {
                if (pressedKey.toLowerCase() === "e" || pressedKey.toLowerCase() === "escape") {
                    this.closeDialogue();
                }
            }
        });
    }

    public static startDialogue(player: Player, npc: NPC, rootDialogue: Dialogue) {
        this.npc = npc;
        StateManager.state = State.DIALOG;
        
        this.ui.attachTo(npc.collistionMesh);
        
        this.goToDialogue(rootDialogue);
    }

    private static goToDialogue(dialogue: Dialogue) {
        this.actualDialogue = dialogue;
        const player = StateManager.actualPlayer;

        for(const action of dialogue.actions) {
            action.execute(StateManager.actualPlayer);
        }

        let animation = new TitleAnimation.AnimationSequence([
            new TitleAnimation.FadeAnimation(100, 0, 1),
            new TitleAnimation.WaitAnimation(150)
        ]);

        player.playerHud.dialog.enqueue({
            text: dialogue.message,
            animation: animation
        });

        this.ui.renderChoices(dialogue.nextDialogs);
    }

    public static closeDialogue() {
        this.ui.hide();
        
        const player = StateManager.actualPlayer;
        player.scene.activeCamera = player.playerCamera;
        player.playerHud.dialog.enqueueFront({ text: "", animation: new TitleAnimation.FadeAnimation(0,0,0) });

        this.npc = null;
        this.actualDialogue = null;
        StateManager.state = State.PLAYING;
    }
}