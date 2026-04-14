import Inventory from "../player/inventory/Inventory";
import { Stats } from "./Stats";

export enum State {
    PLAYING, CINEMATIC, LOADING, DIALOG, IN_INVENTORY
}

export interface StateRules {
    canMove: boolean;
    canOpenInventory: boolean;
    canInteract: boolean;
    pointerLock: boolean
}


export const StateConfig: Record<State, StateRules> = {
    [State.PLAYING]:      { canMove: true,  canOpenInventory: true,  canInteract: true, pointerLock: true },
    [State.CINEMATIC]:    { canMove: false, canOpenInventory: false, canInteract: false, pointerLock: true },
    [State.LOADING]:      { canMove: false, canOpenInventory: false, canInteract: false, pointerLock: false },
    [State.DIALOG]:       { canMove: false, canOpenInventory: false, canInteract: true, pointerLock: true },
    [State.IN_INVENTORY]: { canMove: false, canOpenInventory: true,  canInteract: false, pointerLock: false }
};

export class StateManager {
    public static state: State = State.LOADING;
    public static stats: Stats = new Stats();
    public static inventory: Inventory = new Inventory();

}

