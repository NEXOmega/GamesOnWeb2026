import { Observable } from "@babylonjs/core";
import { Item } from "./Item";

export default class Inventory {
    public items: (Item | null)[] = [];
    public readonly maxSlots: number;

    public onInventoryChanged = new Observable<void>();

    constructor(maxSlots: number = 16) {
        this.maxSlots = maxSlots;
        for (let i = 0; i < maxSlots; i++) {
            this.items.push(null);
        }
    }

    public addItem(newItem: Item): boolean {
        const emptySlotIndex = this.items.findIndex(item => item === null);

        if (emptySlotIndex !== -1) {
            this.items[emptySlotIndex] = newItem;
            this.onInventoryChanged.notifyObservers();
            return true;
        }

        return false;
    }

    public removeItem(slotIndex: number) {
        if (this.items[slotIndex] !== null) {
            this.items[slotIndex] = null;
            this.onInventoryChanged.notifyObservers();
        }
    }
}