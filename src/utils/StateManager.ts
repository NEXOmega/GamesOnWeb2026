import Player from "../characters/Player";
import InteractionEntity from "../entities/InteractionEntity";

export class Stats {
    private morale : number = 50;
    private ethique : number = 50;

    public getMorale() : number {
        return this.morale;
    }

    public addMorale(amount: number) {
        this.morale = this.clamp(this.morale+amount, 0, 100);
    }

    public getEthique() : number {
        return this.ethique;
    }

    public addEthique(amount: number) {
        this.morale = this.clamp(this.morale + amount, 0, 100);
    }

    clamp(number: number, lower: number, upper: number) {
        return Math.min(Math.max(number, lower), upper);
    }
}
export enum State {
    PLAYING, CINEMATIC, LOADING
}

export class StateManager {
    public static actualPlayer: Player;
    public static currectInteractionEntity: InteractionEntity;
    public static state: State = State.LOADING;
    public static stats: Stats = new Stats();

}

