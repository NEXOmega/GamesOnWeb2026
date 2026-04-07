import { Vector3 } from "@babylonjs/core";
import Player from "../characters/Player";
import CollisionEntity from "./CollisionEntity";
import { StateManager } from "../utils/StateManager";
import {Action} from "../actions/Action";

export default class InteractionEntity extends CollisionEntity {
    private onInteractActions: Action[] = [];

    public onMeshEntered(): void {
        super.onMeshEntered();
        StateManager.currectInteractionEntity = this;
    }

    public onMeshExited(): void {
        super.onMeshExited();
        if(StateManager.currectInteractionEntity === this)
            StateManager.currectInteractionEntity = null;
    }

    public addInteractAction(action: Action) {
            this.onInteractActions.push(action);
        }
    
    public onInteract(player: Player): void {
        let distance = Vector3.Distance(player.mesh.position, this.mesh.position);
        if(distance > this.distance) {
            return;
        }
        for(const action of this.onInteractActions) {
            action.execute(player);
        }
    }

    public dispose(): void {
        if(StateManager.currectInteractionEntity === this)
            StateManager.currectInteractionEntity = null;
        super.dispose();
    }
}