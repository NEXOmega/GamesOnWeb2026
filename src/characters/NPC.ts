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
    public readonly facePlayerDistance: number = 5;
    public readonly facePlayerRotationSpeed: number = 5;
    
    static async CreateAsync(
        id: string,
        scene: BaseScene,
        position: Vector3 = Vector3.Zero(),
        dialogId: string,
        rotationQuaternion: Quaternion = Quaternion.Identity()
    ): Promise<NPC> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./assets/models/npc/",
            id + ".glb",
            scene
        );

        const model = result.meshes[0];

        return new NPC(id, model, scene, dialogId, position, rotationQuaternion);
    }

    constructor(
        id: string,
        mesh: AbstractMesh,
        scene: BaseScene,
        dialogId: string,
        position: Vector3 = Vector3.Zero(),
        rotationQuaternion: Quaternion = Quaternion.Identity()
    ) {
        super(id, mesh, scene, Vector3.Zero());
        if(!DialogueManager.getDialog(dialogId))
            throw new Error(`Dialog ${dialogId} for ${id} not found in DialogueManager !`)
        this.dialogId = dialogId;

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = rotationQuaternion.clone();
        
        this.model = mesh;
        this.model.parent = this.collistionMesh;

        this.collistionMesh.position = position;
        this.model.position.y = -1;
        this.model.scaling = new Vector3(0.5, 0.5, 0.5);

        this.interaction = new InteractionEntity(id+"_interaction",this.scene.actualPlayer, 10, scene);
        this.interaction.addMeshEnteredAction(new SendFrontTitleRequest({
                text: "Press [E] to talk",
                animation: new TitleAnimation.FadeAnimation(1,0,1)
            }));
        this.interaction.addMeshExitedAction(new CloseDialogueAction(this.id));
        this.interaction.addMeshExitedAction(new ClearDialog());


        this.interaction.addInteractAction(new MoveCinematicCamera(this.scene as BaseScene, this.collistionMesh));
        this.interaction.addInteractAction(new StartDialogueAction(this.id, dialogId));

        this.addChild(this.interaction)

        // 1. On lui donne un poids normal pour qu'il tombe vers le sol
        this.physicsAggregate = new PhysicsAggregate(this.collistionMesh, PhysicsShapeType.CAPSULE, { mass: 80, restitution: 0 }, scene);
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);

        let framesStill = 0; 
        
        const observer = this.scene.onBeforeRenderObservable.add(() => {
            if (!this.physicsAggregate || !this.physicsAggregate.body) return;

            const velY = Math.abs(this.physicsAggregate.body.getLinearVelocity().y);
            
            if (velY < 0.05) {
                framesStill++;
            } else {
                framesStill = 0;
            }

            if (framesStill > 15) {
                this.physicsAggregate.body.setMassProperties({ 
                    mass: 0, 
                    inertia: Vector3.ZeroReadOnly 
                });
                
                this.scene.onBeforeRenderObservable.remove(observer); 
                console.log(`Le NPC ${this.id} a atterri et est maintenant figé !`);
            }
        });

        this.scene.entityManager.addEntity(this);
    }

    public update(delta: number): void {
        super.update(delta);
        this.facePlayerWhenClose(delta);
    }

    private facePlayerWhenClose(delta: number): void {
        const player = this.scene.actualPlayer;
        if (!player) return;

        const npcPos = this.collistionMesh.getAbsolutePosition();
        const playerPos = player.impostorMesh.getAbsolutePosition();
        const direction = playerPos.subtract(npcPos);
        direction.y = 0;

        if (direction.lengthSquared() <= 0.0001) return;
        if (direction.lengthSquared() > this.facePlayerDistance * this.facePlayerDistance) return;

        direction.normalize();

        if (!this.model.rotationQuaternion) {
            this.model.rotationQuaternion = Quaternion.Identity();
        }

        const deltaSeconds = delta / 1000;
        const targetWorldRotation = Quaternion.FromLookDirectionLH(direction, Vector3.Up());
        const targetLocalRotation = Quaternion.Inverse(this.collistionMesh.absoluteRotationQuaternion).multiply(targetWorldRotation);

        this.model.rotationQuaternion = Quaternion.Slerp(
            this.model.rotationQuaternion,
            targetLocalRotation,
            Math.min(1, this.facePlayerRotationSpeed * deltaSeconds)
        );
    }

}
