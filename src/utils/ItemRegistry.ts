import { Item } from "../player/inventory/Item";

export default class ItemRegistry {
   private static items : Map<string, Item> = new Map();

   public static async loadFromJson(jsonUrl: string): Promise<void> {
        try {
            const response = await fetch(jsonUrl);
            
            if (!response.ok) {
                throw new Error(`Impossible de charger le fichier JSON : status ${response.status}`);
            }

            const data: Item[] = await response.json();

            data.forEach(item => {
                this.registerItem(item);
            });

            console.log(`ItemRegistry : ${this.items.size} objets chargés avec succès !`);
        } catch (error) {
            console.error("Erreur lors du chargement des items :", error);
        }
    }

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
                iconUrl: "./textures/items/missing_texture.png"
            }
   }
}