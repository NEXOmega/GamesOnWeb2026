import { Scene, HemisphericLight, Vector3, MeshBuilder, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ExecuteCodeAction, ActionManager } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";

import BaseScene from './BaseScene';
import DebugEntity from '../entities/DebugEntity';
import CinematicCamera from '../camera/CinematicCamera';
import Player from '../characters/Player';
import CollisionEntity from '../entities/CollisionEntity';
import { State, StateManager } from '../utils/StateManager';
import InteractionEntity from '../entities/InteractionEntity';
import * as TitleAnimation from '../gui/title/TitleAnimation'
import { AnimationSerializer } from '../utils/json/AnimationSerializer';
import NPC from '../characters/NPC';

export default class MyScene extends BaseScene {

    async createScene() : Promise<void> {
        this.cinematicCamera = new CinematicCamera(this, this.canvas);

        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);

        this.collisionsEnabled = true;
        this.enablePhysics(new Vector3(0, -100, 0), havokPlugin);
        // Hide/show the Inspector with Alt+I   
        window.addEventListener("keydown", (ev) => {
            if (ev.altKey && ev.key === 'i') {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show({ embedMode: true });
                }
            }
        });

        window.addEventListener("keydown", (ev) => {
            if(ev.altKey && ev.key === 'c') {
                if(this.activeCamera == this.cinematicCamera) {
                    this.activeCamera = StateManager.actualPlayer.playerCamera;
                    StateManager.state = State.PLAYING;
                } else {
                    this.activeCamera = this.cinematicCamera;
                    StateManager.state = State.CINEMATIC;
                        this.cinematicCamera.moveTo(this.cinematicCamera.position.add(new Vector3(0,5,0)), 5)
                }
            }
        })

        this.light = new HemisphericLight('light1', new Vector3(0,1,0), this);
    }

    async createEnvironment(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Prototype_Level.glb",
            this
        );

        console.log("Level loaded")
        
        meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {
                const physicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this);
                mesh.checkCollisions = true;
                console.log("Physics aggregate created")
            }
        });

        Player.CreateAsync(this, new Vector3(0, 10, 0)).then((player) => {
            StateManager.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;

            let collisionEntity = new InteractionEntity(player, 1, this, new Vector3(5,2,5));
            collisionEntity.meshEnteredFunc = (actionEvent: any) => {
                console.log("Entered collision entity");

            }
            
            collisionEntity.meshExitedFunc = (actionEvent: any) => {
                console.log("Exited collision entity");
            }

            collisionEntity.onInteract = (player: Player) => {
                console.log("Player interacted with collision entity");
                player.playerHud.title.enqueue({
                    text: "",
                    animation: new TitleAnimation.SetTextInfoAnimation(0, "white", 130, 0)
                })
                
                let animation = new TitleAnimation.AnimationSequence([
                                new TitleAnimation.FadeAnimation(100, 0, 1),
                                new TitleAnimation.WaitAnimation(150),
                                new TitleAnimation.FadeAnimation(100, 1, 0)
                            ])
                const serialized = AnimationSerializer.Serialize(animation)
                const deserialized = AnimationSerializer.Deserialize(serialized)
                console.log(deserialized)

                player.playerHud.title.enqueue({
                    text: "Test de serialization",
                    animation: deserialized
                })


            }

            const testNPC = NPC.CreateAsync(this, new Vector3(5,1,0));

            this.entityManager.addEntity(collisionEntity);
            StateManager.state = State.PLAYING;
        });
    }
}
