import Player from "../characters/Player";
import { FadeAnimation } from "../gui/title/TitleAnimation";
import {Action} from "./Action";

//TODO See why it doesnt hide dialogue 
export default class ClearDialog extends Action {
    readonly type = "ClearDialogue";
    constructor() {
        super();
    }

    public execute(player: Player) {
        player.playerHud.dialog.enqueue({ text: "", animation: new FadeAnimation(0,0,0) });
    }
}