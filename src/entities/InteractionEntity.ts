import { Vector3 } from "@babylonjs/core";
import Player from "../characters/Player";
import CollisionEntity from "./CollisionEntity";
import { StateManager } from "../utils/StateManager";

export default class InteractionEntity extends CollisionEntity {
    public onInteractFunc: (player: Player) => void;

    public onMeshEntered(): void {
        super.onMeshEntered();
        StateManager.currectInteractionEntity = this;
    }

    public onMeshExited(): void {
        super.onMeshExited();
        if(StateManager.currectInteractionEntity === this)
            StateManager.currectInteractionEntity = null;
    }
    
    public onInteract(player: Player): void {
        let distance = Vector3.Distance(player.mesh.position, this.mesh.position);
        if(distance > this.distance) {
            return;
        }
        if (this.onInteractFunc) {
            this.onInteractFunc(player);
        }
    }
}