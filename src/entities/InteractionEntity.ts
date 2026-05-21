import { Vector3 } from "@babylonjs/core";
import Player from "../characters/Player";
import CollisionEntity from "./CollisionEntity";
import { StateManager } from "../utils/StateManager";
import {Action} from "../actions/Action";

export default class InteractionEntity extends CollisionEntity {
    private onInteractActions: Action[] = [];

    public onMeshEntered(): void {
        super.onMeshEntered();
        this.scene.currectInteractionEntity = this;
    }

    public onMeshExited(): void {
        super.onMeshExited();
        if(this.scene.currectInteractionEntity === this)
            this.scene.currectInteractionEntity = null;
    }

    public addInteractAction(action: Action) {
            this.onInteractActions.push(action);
        }
    
    public onInteract(player: Player): void {
        let distance = Vector3.Distance(player.mesh.getAbsolutePosition(), this.mesh.getAbsolutePosition());
        if(distance > this.distance) {
            return;
        }
        for(const action of this.onInteractActions) {
            action.execute(player);
        }
    }

    public dispose(): void {
        if(this.scene.currectInteractionEntity === this)
            this.scene.currectInteractionEntity = null;
        super.dispose();
    }
}