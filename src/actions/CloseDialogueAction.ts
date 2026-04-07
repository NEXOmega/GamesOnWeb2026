import Player from "../characters/Player";
import TitleRequest from "../gui/title/TitleRequest";
import {Action} from "./Action";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import DialogueManager from "../dialogs/DialogueManager";
import NPC from "../characters/NPC";
import { Expose } from "class-transformer";

export default class CloseDialogueAction extends Action {
    readonly type = "CloseDialogueAction";

    private npc: NPC;

    constructor(npc: NPC) {
        super();
        this.npc = npc;
    }

    public execute(player: Player) {
        if(DialogueManager.npc != this.npc)
            return;

        player.playerHud.dialog.enqueueFront({
                        text: "",
                        animation: new TitleAnimation.FadeAnimation(1,1,0)
                    })            
        DialogueManager.closeDialogue();
    }
}