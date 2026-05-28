import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, SceneLoader, Vector3 } from "@babylonjs/core";

import { ClearDialog, CloseDialogueAction, StartDialogueAction } from "../actions/Action";
import MoveCinematicCamera from "../actions/MoveCinematicCamera";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import DialogueManager from "../dialogs/DialogueManager";
import Entity from "../entities/Entity";
import InteractionEntity from "../entities/InteractionEntity";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import BaseScene from "../scenes/BaseScene";

export default class NPC extends Entity {

    public readonly collistionMesh: AbstractMesh;
    public readonly model: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;
    readonly interaction: InteractionEntity;

    public dialogId: string
    
    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero(), dialogId: string): Promise<NPC> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./assets/models/npc/",
            id + ".glb",
            scene
        );

        const model = result.meshes[0];

        return new NPC(id, model, scene, dialogId, position);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, dialogId: string, position: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, Vector3.Zero(), rotation);
        if(!DialogueManager.getDialog(dialogId))
            throw new Error(`Dialog ${dialogId} for ${id} not found in DialogueManager !`)
        this.dialogId = dialogId;

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = Quaternion.Identity();
        
        this.model = mesh;
        this.model.parent = this.collistionMesh;

        this.collistionMesh.position = position;
        this.model.position.y = -1;

        this.interaction = new InteractionEntity(id+"_interaction",this.scene.actualPlayer, 5, scene);
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

}