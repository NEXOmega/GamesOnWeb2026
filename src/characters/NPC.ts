import { AbstractMesh, Color3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import InteractionEntity from "../entities/InteractionEntity";
import Entity from "../entities/Entity";
import Tickable from "../utils/Tickable";
import { State, StateManager } from "../utils/StateManager";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import BaseScene from "../scenes/BaseScene";
import Player from "./Player";
import Dialogue from "../dialogs/Dialogue";
import DialogueManager from "../dialogs/DialogueManager";
import { AdvancedDynamicTexture, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui";
import { getRotationFromPositions } from "../utils/3DUtils";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import MoveCinematicCamera from "../actions/MoveCinematicCamera";
import { ClearDialog, CloseDialogueAction, StartDialogueAction } from "../actions/Action";

export default class NPC extends Entity {

    public readonly collistionMesh: AbstractMesh;
    public readonly model: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;
    readonly interaction: InteractionEntity;

    public dialogId: string
    
    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero(), dialogId: string): Promise<NPC> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Character.glb",
            scene
        );

        const model = result.meshes[0];

        return new NPC(id, model, scene, dialogId, position);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, dialogId: string, position: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, Vector3.Zero(), rotation);
        this.dialogId = dialogId;

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = Quaternion.Identity();
        
        this.model = mesh;
        this.model.parent = this.collistionMesh;

        this.collistionMesh.position = position;
        this.model.position.y = -1;

        this.interaction = new InteractionEntity(id+"_interaction",StateManager.actualPlayer, 5, scene);
        this.interaction.addMeshEnteredAction(new SendFrontTitleRequest({
                text: "Hey !",
                animation: new TitleAnimation.FadeAnimation(1,0,1)
            }));
        this.interaction.addMeshExitedAction(new CloseDialogueAction(this.id));
        this.interaction.addMeshExitedAction(new ClearDialog());


        this.interaction.addInteractAction(new MoveCinematicCamera(this.scene as BaseScene, this.collistionMesh));
        this.interaction.addInteractAction(new StartDialogueAction(this.id, dialogId));

        this.addChild(this.interaction)

        this.physicsAggregate = new PhysicsAggregate(this.collistionMesh, PhysicsShapeType.CAPSULE, { mass: 0, restitution: 0 }, scene);
    
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }

}