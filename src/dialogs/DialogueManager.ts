import { Scene } from "@babylonjs/core";
import { plainToInstance } from "class-transformer";

import NPC from "../characters/NPC";
import Player from "../characters/Player";
import DialogueUI from "../gui/DialogUI";
import * as TitleAnimation from  "../gui/title/TitleAnimation";
import InputManager from "../utils/InputManager";
import { State, StateManager } from "../utils/StateManager";
import Dialogue from "./Dialogue";

export default class DialogueManager {
    public static dialogs: Record<string, Dialogue> = {};

    public static actualDialogue: Dialogue | null = null;
    public static npc: NPC | null = null;
    
    public static ui: DialogueUI;

    public static init(scene: Scene) {
        this.ui = new DialogueUI(scene);
    }

    public static update() {
        if (StateManager.state !== State.DIALOG || !this.actualDialogue || !this.npc) return;

        const keysPressed = InputManager.getKeysJustPressed();
        const player = this.npc.scene.actualPlayer;

        for (const pressedKey of keysPressed) {
            if (this.ui.isTyping) {
                this.ui.finishTyping();
                return; 
            }

            if (!this.actualDialogue.canChooseNextChoice) continue;
            
            const nextNode = this.actualDialogue.getNextDialog(pressedKey);

            if (nextNode && nextNode.checkConditions(player)) {
                this.goToDialogue(nextNode);
                return;
            } 
            else {
                const availableChoices = Object.values(this.actualDialogue.nextDialogs).filter(d => d.checkConditions(player));
                
                if (availableChoices.length === 0) {
                    if (pressedKey === "e" || pressedKey === "escape") {
                        this.closeDialogue();
                        return;
                    }
                }
            }
        }
    }

    public static startDialogue(player: Player, npc: NPC, dialogueId: string) {
        const rootDialogue = this.getDialog(dialogueId);
        if (!rootDialogue) return;

        this.npc = npc;
        StateManager.state = State.DIALOG;
        
        this.ui.show();
        
        this.goToDialogue(rootDialogue);
    }

    private static goToDialogue(dialogue: Dialogue) {
        this.actualDialogue = dialogue;
        const player = this.npc!.scene.actualPlayer;

        if (dialogue.actions) {
            for(const action of dialogue.actions) {
                action.execute(player);
            }
        }

        this.ui.setMessage(dialogue.message);

        const availableNextDialogs: Record<string, Dialogue> = {};
        
        for (const [key, nextDialog] of Object.entries(dialogue.nextDialogs)) {
            if (nextDialog.checkConditions(player)) {
                availableNextDialogs[key] = nextDialog;
            }
        }
        
        this.ui.renderChoices(availableNextDialogs, (key) => {
            const nextNode = this.actualDialogue?.getNextDialog(key);
            if (nextNode) this.goToDialogue(nextNode);
        });
    }

    public static closeDialogue() {
        this.ui.hide();
        
        const player = this.npc.scene.actualPlayer;
        player.scene.activeCamera = player.playerCamera;
        player.playerHud.dialog.enqueueFront({ text: "", animation: new TitleAnimation.FadeAnimation(0,0,0) });

        this.npc = null;
        this.actualDialogue = null;
        StateManager.state = State.PLAYING;
    }

    public static async loadAll() {
        try {
            const indexResponse = await fetch('./assets/dialogue/_dialogue_list.json');
            
            if (!indexResponse.ok) {
                throw new Error("Impossible de trouver _dialogue_list.json");
            }

            const fileNames: string[] = await indexResponse.json();

            for (const fileName of fileNames) {
                try {
                    const response = await fetch(`./assets/dialogue/${fileName}.json`);
                    const rawJson = await response.json();

                    const dialogueInstance = plainToInstance(Dialogue, rawJson);
                    this.dialogs[fileName] = dialogueInstance;
                    
                    console.log(`Dialogue chargé avec succès : ${fileName}`);
                } catch (err) {
                    console.error(`Erreur sur le fichier ${fileName}.json :`, err);
                }
            }

            console.log("Tous les dialogues sont prêts !");

        } catch (error) {
            console.error("Erreur critique lors de l'initialisation des dialogues :", error);
        }
    }

    public static getDialog(id: string): Dialogue | undefined {
        return this.dialogs[id];
    }
}