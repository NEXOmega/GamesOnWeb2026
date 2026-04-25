import { AbstractMesh, SceneLoader, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";
import { ConsoleLogAction } from "../actions/Action";
import { ActionSerializer } from "../utils/json/ActionSerializer";
import BaseScene from "../scenes/BaseScene";

export default class Interactable extends Entity {

    public readonly model: AbstractMesh;
    readonly interaction: InteractionEntity;
        
    static async CreateAsync(id: string, scene: BaseScene, position: Vector3, actionsString: string): Promise<Interactable> {
        const result = await SceneLoader.ImportMeshAsync(
                    "",
                    "./models/",
                    "Character.glb",
                    scene
                );
        
                const model = result.meshes[0];
        
        return new Interactable(id, model, scene, position, actionsString);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero(), actionsString: string, rotation: Vector3 = Vector3.Zero()) {
        // On passe les vraies coordonnées locales à l'Entity mère
        super(id, mesh, scene, position, rotation);
                
        this.model = mesh;
        
        this.interaction = new InteractionEntity(id+"_interaction", this.scene.actualPlayer, 5, scene);
        
        // CORRECTION 2 : On force la mise à jour de la boîte englobante au cas où
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