import 'reflect-metadata';

import { Expose } from "class-transformer";

import Player from "../characters/Player";
import { StateManager } from "../utils/StateManager";

export abstract class Condition {
    readonly type: string;

    public abstract evaluate(player: Player): boolean;
}

/**
 * Vérifie si le joueur possède un objet spécifique
 */
export class HasItemCondition extends Condition {
    readonly type = "HasItemCondition";

    @Expose()
    private itemId: string;

    @Expose()
    private quantity: number;

    constructor(itemId: string, quantity: number = 1) {
        super();
        this.itemId = itemId;
        this.quantity = quantity;
    }

    public evaluate(player: Player): boolean {
        return StateManager.inventory.hasItem(this.itemId, this.quantity);
    }
}

/**
 * Vérifie un état spécifique
 */
export class FlagStateCondition extends Condition {
    readonly type = "FlagStateCondition";

    @Expose()
    private flag: string;

    @Expose()
    private state: boolean;

    constructor(flag: string, state: boolean = true) {
        super();
        this.flag = flag;
        this.state = state;
    }

    public evaluate(player: Player): boolean {
        return StateManager.getFlag(this.flag) == this.state;
    }
}