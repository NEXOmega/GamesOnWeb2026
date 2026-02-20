import Player from "../characters/Player";
import InteractionEntity from "../entities/InteractionEntity";


export enum State {
    PLAYING, CINEMATIC, LOADING
}

export class StateManager {
    public static actualPlayer: Player;
    public static currectInteractionEntity: InteractionEntity;
    public static state: State = State.LOADING;

}
