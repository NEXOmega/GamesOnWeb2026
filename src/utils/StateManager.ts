import Player from "../characters/Player";
import InteractionEntity from "../entities/InteractionEntity";
import Inventory from "../player/inventory/Inventory";
import { Stats } from "./Stats";

export enum State {
    PLAYING, CINEMATIC, LOADING, DIALOG, IN_INVENTORY
}

export class StateManager {
    public static actualPlayer: Player;
    public static currectInteractionEntity: InteractionEntity;
    public static state: State = State.LOADING;
    public static stats: Stats = new Stats();
    public static inventory: Inventory = new Inventory();

}

