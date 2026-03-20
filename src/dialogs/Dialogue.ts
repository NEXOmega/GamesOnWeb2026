import Action from "../actions/Action";

export default class Dialogue {
    public nextDialogs: Record<string, Dialogue> = {};
    public key: string;
    public choiceText: string;
    public message: string;
    public actions: Action[] = [];
    public canChooseNextChoice = true;

    constructor(key: string, choiceText: string, message: string) {
        this.key = key;
        this.choiceText = choiceText;
        this.message = message;
    }

    public addNextDialog(dialog: Dialogue) {
        this.nextDialogs[dialog.key.toLowerCase()] = dialog;
    }

    public getNextDialog(key: string): Dialogue | undefined {
        return this.nextDialogs[key.toLowerCase()];
    }
}