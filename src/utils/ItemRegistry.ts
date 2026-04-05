import { Item } from "../player/inventory/Item";

export default class ItemRegistry {
   private static items : Map<string, Item> = new Map();

   public static registerItem(item: Item): void {
        this.items.set(item.id, item);
   }

   public static getItem(itemId: string) : Item {
        if(this.items.has(itemId))
            return this.items.get(itemId);

        return {
                id: itemId,
                name: "Missing Item",
                description: "Missing Item, try reloading game.",
                iconUrl: "./images/potion.png"
            }
   }
}