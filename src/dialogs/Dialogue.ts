import NPC from "../characters/NPC";
import Player from "../characters/Player";
import * as TitleAnimation from '../gui/title/TitleAnimation'

export default class Dialogue {
    public nextDialogs = {}

    public key: string;
    public choiceText: string;
    public message: string;

    //Set to true when the dialog is fully displayed and we can go to next one
    public canChooseNextChoice = true;

    constructor(key: string, choiceText: string, message: string) {
        this.key = key;
        this.message = message;
        this.choiceText = choiceText;
    }

    execute(player: Player, npc: NPC) {
        let animation = new TitleAnimation.AnimationSequence([
                            new TitleAnimation.FadeAnimation(100, 0, 1),
                            new TitleAnimation.WaitAnimation(150)
                            //TODO create a pseudo animation that make canChooseNextChoice
                        ])

        player.playerHud.dialog.enqueue({
            text: this.message,
            animation: animation
        })
        npc.updateDialogPanel(this);
    }

    public addNextDialog(dialog: Dialogue) {
        this.nextDialogs[dialog.key] = dialog;
    }

    public getNextDialog(key: string) {
        return this.nextDialogs[key];
    }

}