// ItemRegistry.ts
import { Item } from "./Item";

const items: Map<string, Item> = new Map();

export default class ItemRegistry {
    static getItem(id: string): Item {
        return items.get(id);
    }

    static async loadFromJson(path: string): Promise<void> {
        const response = await fetch(path);
        const data: Item[] = await response.json();
        data.forEach(item => items.set(item.id, item));
        console.log(`[ItemRegistry] ${items.size} items chargés`);
    }
}