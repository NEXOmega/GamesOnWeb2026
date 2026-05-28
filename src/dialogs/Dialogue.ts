import { Expose, plainToInstance, Transform, Type } from "class-transformer";

import { Action } from "../actions/Action";
import Player from "../characters/Player";
import { Condition } from "../condition/Condition";
import { ALL_ACTIONS } from "../utils/json/ActionSerializer";
import { ALL_CONDITIONS } from "../utils/json/ConditionSerializer";

export default class Dialogue {

    @Expose()
    public key: string;
    @Expose()
    public choiceText: string;
    @Expose()
    public message: string;

    @Type(() => Object, {
        discriminator: {
            property: 'type',
            subTypes: ALL_ACTIONS
        }
    })
    @Expose()
    public actions: Action[] = [];
    
    @Type(() => Object, {
        discriminator: {
            property: 'type',
            subTypes: ALL_CONDITIONS
        }
    })
    @Expose()
    public conditions: Condition[] = [];

    @Expose()
    public canChooseNextChoice = true;

    @Transform(({ value }) => {
        const dict: Record<string, Dialogue> = {};
        
        if (value) {
            for (const key in value) {
                dict[key] = plainToInstance(Dialogue, value[key]);
            }
        }
        return dict;
    })
    @Expose()
    public nextDialogs: Record<string, Dialogue> = {};

    constructor(key: string, choiceText: string, message: string) {
        this.key = key;
        this.choiceText = choiceText;
        this.message = message;
    }

    public checkConditions(player: Player): boolean {
        if (!this.conditions || this.conditions.length === 0) return true;
        return this.conditions.every(condition => condition.evaluate(player));
    }

    public addNextDialog(dialog: Dialogue) {
        this.nextDialogs[dialog.key.toLowerCase()] = dialog;
    }

    public getNextDialog(key: string): Dialogue | undefined {
        return this.nextDialogs[key.toLowerCase()];
    }
}