import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import { StateManager } from "../utils/StateManager";
import ItemRegistry from "../utils/ItemRegistry";
import BaseScene from "../scenes/BaseScene";
import { AddItemToInventory, ClearDialog, RemoveEntityFromScene } from "../actions/Action";

export default class Pickable extends Entity {


        public readonly collistionMesh: AbstractMesh;
        public readonly model: AbstractMesh;
        readonly interaction: InteractionEntity;
        
    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero(), itemId: string, quantity: number): Promise<Pickable> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Character.glb",
            scene
        );

        const model = result.meshes[0];

        return new Pickable(id, model, scene, position, itemId, quantity);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero(), itemId: string, quantity: number, rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, position, rotation);

        if(!ItemRegistry.getItem(itemId))
            throw new Error(`Erreur le type ${itemId}, nest pas enregistré dans l'ItemRegistry`)

                
        this.model = mesh;
        this.model.position = position;
        
        this.interaction = new InteractionEntity(id+"_interaction", this.scene.actualPlayer, 5, scene);
        this.model.computeWorldMatrix(true);
        const centerLocal = this.model.getBoundingInfo().boundingBox.center;
        this.interaction.mesh.position = centerLocal;
        
        this.interaction.addMeshEnteredAction(new SendFrontTitleRequest({
                text: "Pickup " + ItemRegistry.getItem(itemId).name,
                animation: new TitleAnimation.FadeAnimation(1,0,1)
            }));
        this.interaction.addMeshExitedAction(new ClearDialog());

        this.interaction.addInteractAction(new AddItemToInventory(itemId, quantity));
        this.interaction.addInteractAction(new RemoveEntityFromScene(this.id))
        this.interaction.addInteractAction(new ClearDialog());
        
        this.addChild(this.interaction);
    }
}