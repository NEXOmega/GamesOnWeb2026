import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import InteractionEntity from "../entities/InteractionEntity";
import Entity from "../entities/Entity";
import Tickable from "../utils/Tickable";
import { StateManager } from "../utils/StateManager";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import BaseScene from "../scenes/BaseScene";
import Player from "./Player";

export default class NPC extends Entity {

    public readonly collistionMesh: AbstractMesh;
    public readonly model: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;
    readonly interaction: InteractionEntity;
    
    static async CreateAsync(scene: Scene, position: Vector3 = Vector3.Zero()): Promise<NPC> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Character.glb",
            scene
        );

        const model = result.meshes[0];

        return new NPC(model, scene, position);
    }

    constructor(mesh: AbstractMesh, scene: Scene, position: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        super(mesh, scene, Vector3.Zero(), rotation);

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = Quaternion.Identity();
        
        this.model = mesh;
        this.model.parent = this.collistionMesh;

        this.collistionMesh.position = position;
        this.model.position.y = -1;

        this.interaction = new InteractionEntity(StateManager.actualPlayer, 5, scene);
        this.interaction.meshEnteredFunc = (actionEvent) => {
            if(this.interaction.target != StateManager.actualPlayer)
                return;
            const player = this.interaction.target as Player;
            player.playerHud.title.enqueue({
                text: "",
                animation: new TitleAnimation.SetTextInfoAnimation(0, "white", 130, 0)
            })
                            
            let animation = new TitleAnimation.AnimationSequence([
                    new TitleAnimation.FadeAnimation(100, 0, 1),
                        new TitleAnimation.WaitAnimation(150),
                ])
            
            player.playerHud.title.enqueue({
                text: "Press E to interact.",
                animation: animation
            })
        }

        this.interaction.meshExitedFunc = (actionEvent) => {
            if(this.interaction.target != StateManager.actualPlayer)
                return;
            const player = this.interaction.target as Player;
            player.playerHud.title.enqueue({
                text: "",
                animation: new TitleAnimation.SetTextInfoAnimation(0, "white", 130, 0)
            })
        }
        this.interaction.onInteractFunc = (player) => {
            console.log("Player interacted with collision entity");
            let cinematicCamera = (this.scene as BaseScene).cinematicCamera;
            cinematicCamera.teleport(this.collistionMesh.position.add(new Vector3(3,2,3)));
            cinematicCamera.lookAt(this.collistionMesh.position.add(new Vector3(0,1.5,0)));
            scene.activeCamera = cinematicCamera;

            player.playerHud.title.enqueue({
                text: "",
                animation: new TitleAnimation.SetTextInfoAnimation(0, "white", 130, 0)
            })
                            
            let animation = new TitleAnimation.AnimationSequence([
                    new TitleAnimation.FadeAnimation(100, 0, 1),
                        new TitleAnimation.WaitAnimation(150),
                        new TitleAnimation.FadeAnimation(100, 1, 0)
                ])
            
            player.playerHud.title.enqueue({
                text: "Pompe moi le poireau",
                animation: animation
            })
        }

        this.interaction.mesh.parent = this.collistionMesh;

        this.physicsAggregate = new PhysicsAggregate(this.collistionMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
    
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }
}