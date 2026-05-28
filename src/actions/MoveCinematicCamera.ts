import { AbstractMesh, Vector3 } from "@babylonjs/core";

import Player from "../characters/Player";
import BaseScene from "../scenes/BaseScene";
import { getRotationFromPositions } from "../utils/3DUtils";
import { State, StateManager } from "../utils/StateManager";
import {Action} from "./Action";

export default class MoveCinematicCamera extends Action {
    readonly type = "MoveCinematicCamera";

    private scene: BaseScene;
    private npcCollisionMesh: AbstractMesh;

    constructor(scene: BaseScene, npcCollisionMesh: AbstractMesh) {
        super();
        this.scene = scene;
        this.npcCollisionMesh = npcCollisionMesh;
    }

    public execute(player: Player) {
        if (StateManager.state !== State.DIALOG) {
            const cinematicCamera = (this.scene as BaseScene).cinematicCamera;
                            
            cinematicCamera.teleport(player.impostorMesh.position);
            this.scene.activeCamera = cinematicCamera;
            const targetRot = getRotationFromPositions(this.npcCollisionMesh.position.add(new Vector3(3,2,3)), this.npcCollisionMesh.position.add(new Vector3(0,1.5,0)))
            cinematicCamera.moveTo(player.impostorMesh.position, this.npcCollisionMesh.position.add(new Vector3(3,2,3)), cinematicCamera.rotation, targetRot, 1)
        }
    }
}