import { Observable } from "@babylonjs/core";
import { Item } from "../../items/Item";

export default class Inventory {
    public items: Map<string, number> = new Map();
    public readonly maxSlots: number;

    public onInventoryChanged = new Observable<void>();

    constructor(maxSlots: number = 16) {
        this.maxSlots = maxSlots;
    }

    public addItem(itemId: string, quantity: number = 1): boolean {
        const remainingSlots = this.maxSlots - this.items.size;
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

    public removeItem(itemId: string, quantity: number) : boolean {
        if(!this.items.has(itemId))
            return false;
        this.items.set(itemId, this.items.get(itemId) - quantity);
        if(this.items.get(itemId) <= 0)
            this.items.delete(itemId);
        this.onInventoryChanged.notifyObservers();
        return true;
    }

    public hasItem(itemId: string, quantity : number = 1) : boolean {
        if(this.items.has(itemId)) {
            return this.items.get(itemId) >= quantity;
        }
        return false;
    }

    public serialize(): Record<string, number> {
        return Object.fromEntries(this.items);
    }

    public deserialize(savedData: Record<string, number>) {
        if(savedData == undefined) return;
        this.items = new Map(Object.entries(savedData));
        
        this.onInventoryChanged.notifyObservers();
        console.log("Loaded Invetory fro msave")
    }
}