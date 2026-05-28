import {HealingPotion} from "./HealthPotion";
import {UsableItem} from "./UsableItems";


const usables: Map<string, UsableItem> = new Map([
    ["health_potion", new HealingPotion(50)]
]);

export default class UsableRegistry {
    static get(itemId: string): UsableItem | undefined {
        return usables.get(itemId);
    }
}