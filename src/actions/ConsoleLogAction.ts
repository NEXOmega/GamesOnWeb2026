import Player from "../characters/Player";
import Action from "./Action";

export default class ConsoleLogAction extends Action {
    private message: String;

    constructor(message: String) {
        super();
        this.message = message;
    }

    public execute(player: Player) {
        console.log(this.message);
    }
}