import { AbstractMesh, Vector3 } from "@babylonjs/core";

import { ConsoleLogAction } from "../actions/Action";
import BaseScene from "../scenes/BaseScene";
import { ActionSerializer } from "../utils/json/ActionSerializer";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";

export default class Interactable extends Entity {

    public readonly model: AbstractMesh;
    readonly interaction: InteractionEntity;
        
    static async CreateAsync(id: string, scene: BaseScene, mesh: AbstractMesh, actionsString: string): Promise<Interactable> {

        mesh.setParent(null);
        
        return new Interactable(id, mesh, scene, mesh.position, actionsString, mesh.rotation);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero(), actionsString: string, rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, position, rotation);
                
        this.model = mesh;
        
        this.interaction = new InteractionEntity(id+"_interaction", this.scene.actualPlayer, 5, scene);
        
        this.model.computeWorldMatrix(true);
        this.model.refreshBoundingInfo(true, true);
        
        const centerLocal = this.model.getBoundingInfo().boundingBox.center;
        this.interaction.mesh.position = centerLocal;
        
        this.interaction.addInteractAction(new ConsoleLogAction("Test"));
        
        const actions = ActionSerializer.deserializeArray(actionsString);
        for(const action of actions) {
            this.interaction.addInteractAction(action);
        }

        this.addChild(this.interaction);
        this.scene.entityManager.addEntity(this);
    }
}