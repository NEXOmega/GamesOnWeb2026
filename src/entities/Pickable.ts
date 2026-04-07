import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import { StateManager } from "../utils/StateManager";
import ItemRegistry from "../utils/ItemRegistry";
import CloseDialogueAction from "../actions/CloseDialogueAction";
import ClearDialog from "../actions/ClearDialogAction";
import RemoveEntityFromScene from "../actions/RemoveEntityFromScene";
import BaseScene from "../scenes/BaseScene";
import { AddItemToInventory } from "../actions/Action";

export default class Pickable extends Entity {


        public readonly collistionMesh: AbstractMesh;
        public readonly model: AbstractMesh;
        readonly physicsAggregate: PhysicsAggregate;
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

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = Quaternion.Identity();
                
        this.model = mesh;
        this.model.parent = this.collistionMesh;
        
        this.collistionMesh.position = position;
        this.model.position.y = -1;
        
        this.interaction = new InteractionEntity(id+"_interaction", StateManager.actualPlayer, 5, scene);
        this.interaction.addMeshEnteredAction(new SendFrontTitleRequest({
                text: "Pickup " + ItemRegistry.getItem(itemId).name,
                animation: new TitleAnimation.FadeAnimation(1,0,1)
            }));
        this.interaction.addMeshExitedAction(new ClearDialog());

        this.interaction.addInteractAction(new AddItemToInventory(itemId, quantity));
        this.interaction.addInteractAction(new RemoveEntityFromScene(this))
        this.interaction.addInteractAction(new ClearDialog());
        
        this.addChild(this.interaction);
        
        this.physicsAggregate = new PhysicsAggregate(this.collistionMesh, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 0 }, scene);
            
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }

}