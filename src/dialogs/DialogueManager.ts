import NPC from "../characters/NPC";
import Player from "../characters/Player";
import { State, StateManager } from "../utils/StateManager";
import Dialogue from "./Dialogue";
import InputManager from "../utils/InputManager";
import { Scene } from "@babylonjs/core";
import * as TitleAnimation from  "../gui/title/TitleAnimation";
import { plainToInstance } from "class-transformer";
import DialogueUI from "../gui/DialogUI2";

export default class DialogueManager {
    public static dialogs: Record<string, Dialogue> = {};

    public static actualDialogue: Dialogue | null = null;
    public static npc: NPC | null = null;
    
    public static ui: DialogueUI;

    public static init(scene: Scene) {
        this.ui = new DialogueUI(scene);

        InputManager.onAnyKeyPressed.add((pressedKey) => {
            if (StateManager.state !== State.DIALOG || !this.actualDialogue) return;

            if (this.ui.isTyping) {
                this.ui.finishTyping();
                return;
            }

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

    public static startDialogue(player: Player, npc: NPC, dialogueId: string) {
        const rootDialogue = this.getDialog(dialogueId);
        if (!rootDialogue) return;

        this.npc = npc;
        StateManager.state = State.DIALOG;
        
        // 1. On affiche l'UI
        this.ui.show();
        
        // Optionnel : si tu veux quand même orienter la caméra vers le NPC
        // player.camera.setTarget(npc.mesh.position);

        this.goToDialogue(rootDialogue);
    }

    private static goToDialogue(dialogue: Dialogue) {
        this.actualDialogue = dialogue;

        // 2. On exécute les actions
        if (dialogue.actions) {
            for(const action of dialogue.actions) {
                action.execute(this.npc.scene.actualPlayer);
            }
        }

        // 3. On envoie le texte au RECTANGLE de l'UI au lieu du HUD
        this.ui.setMessage(dialogue.message);

        // 4. On affiche les choix
        this.ui.renderChoices(dialogue.nextDialogs, (key) => {
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