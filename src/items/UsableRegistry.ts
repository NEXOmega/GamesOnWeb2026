import {UsableItem} from "./UsableItems";
import {HealingPotion} from "./HealthPotion";


const usables: Map<string, UsableItem> = new Map([
    ["health_potion", new HealingPotion(50)]
]);

export default class UsableRegistry {
    static get(itemId: string): UsableItem | undefined {
        return usables.get(itemId);
    }
}