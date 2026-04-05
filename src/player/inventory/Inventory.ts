import { Observable } from "@babylonjs/core";
import { Item } from "./Item";

export default class Inventory {
    public items: Map<string, number> = new Map();
    public readonly maxSlots: number;

    public onInventoryChanged = new Observable<void>();

    constructor(maxSlots: number = 16) {
        this.maxSlots = maxSlots;
    }

    public addItem(itemId: string, quantity: number): boolean {
        const remainingSlots = this.maxSlots - this.items.keys.length;

        if (remainingSlots <= 0) {
            return false;
        }

        if(this.items.has(itemId))
            this.items.set(itemId, this.items.get(itemId)+quantity)
        else
            this.items.set(itemId, quantity)

        this.onInventoryChanged.notifyObservers();
        return true;
    }

    public removeItem(slotIndex: number) {
        if (this.items[slotIndex] !== null) {
            this.items[slotIndex] = null;
            this.onInventoryChanged.notifyObservers();
        }
    }
}