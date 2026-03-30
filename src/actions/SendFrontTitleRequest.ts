import Player from "../characters/Player";
import TitleRequest from "../gui/title/TitleRequest";
import Action from "./Action";

export default class SendFrontTitleRequest extends Action {
    private request: TitleRequest;

    constructor(request: TitleRequest) {
        super();
        this.request = request;
    }

    public execute(player: Player) {
        player.playerHud.dialog.enqueueFront(this.request)
    }
}