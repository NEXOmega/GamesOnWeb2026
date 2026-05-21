// HealingPotion.ts

import Player from "../characters/Player";
import {UsableItem} from "./UsableItems";

export class HealingPotion implements UsableItem {
    readonly itemId = "health_potion";     readonly healAmount: number;

    constructor(healAmount: number = 50) {
        this.healAmount = healAmount;
    }

    use(player: Player): void {
        if (player.isDead) return;

        const before = player.health;
        player.heal(this.healAmount);
        const healed = player.health - before;

        if (healed > 0) {
            player.getInventory().removeItem(this.itemId, 1);
            console.log(`[HealingPotion] +${healed} PV`);
        } else {
            console.log("[HealingPotion] PV déjà au maximum.");
        }
    }
}