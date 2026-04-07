import { Scene, HemisphericLight, Vector3, MeshBuilder, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ExecuteCodeAction, ActionManager } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";

import BaseScene from './BaseScene';
import CinematicCamera from '../camera/CinematicCamera';
import Player from '../characters/Player';
import CollisionEntity from '../entities/CollisionEntity';
import { State, StateManager } from '../utils/StateManager';
import InteractionEntity from '../entities/InteractionEntity';
import * as TitleAnimation from '../gui/title/TitleAnimation'
import { AnimationSerializer } from '../utils/json/AnimationSerializer';
import NPC from '../characters/NPC';
import Dialogue from '../dialogs/Dialogue';
import SceneManager from './SceneManager';
import SaveManager from '../utils/SaveManager';
import ItemRegistry from '../utils/ItemRegistry';
import Pickable from '../entities/Pickable';
import { ConsoleLogAction, TeleportAction } from '../actions/Action';
import { instanceToPlain, plainToInstance } from 'class-transformer';

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
                        this.cinematicCamera.moveTo(this.cinematicCamera.position, this.cinematicCamera.position.add(new Vector3(0,5,0)), this.cinematicCamera.rotation, new Vector3(0,0,0), 5)
                }
            }
        })

        this.light = new HemisphericLight('light1', new Vector3(0,1,0), this);
    }

    async createEnvironment(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "TestLevel.glb",
            this
        );

        console.log("Level loaded")
        
        meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {

                console.log("------- Mesh : " + mesh.name + "-------");
                console.log(mesh.isEnabled());
                if(mesh.metadata.gltf) {
                    console.log(mesh.metadata.gltf.extras)
                }
                const physicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this);
                mesh.checkCollisions = true;
                console.log("Physics aggregate created")
            }
        });

        Player.CreateAsync(this, new Vector3(0, 10, 0)).then((player) => {
            StateManager.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;

            let collisionEntity = new InteractionEntity("clear_save_entity", player, 1, this, new Vector3(5,2,10));
            collisionEntity.addMeshEnteredAction(new ConsoleLogAction("Entered Collision Entity"))
            
            collisionEntity.addMeshExitedAction(new ConsoleLogAction("Exited Collision Entity"))

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
                const serialized = AnimationSerializer.serialize(animation)
                const deserialized = AnimationSerializer.deserialize(serialized)
                console.log(deserialized)

                player.playerHud.title.enqueue({
                    text: "Clearing Save",
                    animation: deserialized
                })
                SaveManager.clearSave()
            }

            let saveEntity = new InteractionEntity("save_entity", player, 1, this, new Vector3(-5,2,5));

            saveEntity.onInteract = (player: Player) => {
                player.playerHud.title.enqueue({
                    text: "",
                    animation: new TitleAnimation.SetTextInfoAnimation(0, "white", 130, 0)
                })
                
                let animation = new TitleAnimation.AnimationSequence([
                                new TitleAnimation.FadeAnimation(100, 0, 1),
                                new TitleAnimation.WaitAnimation(150),
                                new TitleAnimation.FadeAnimation(100, 1, 0)
                            ])
                const serialized = AnimationSerializer.serialize(animation)
                const deserialized = AnimationSerializer.deserialize(serialized)
                console.log(deserialized)

                player.playerHud.title.enqueue({
                    text: "Save",
                    animation: deserialized
                })
                console.log(StateManager.inventory.items)
                SaveManager.save({sceneId: "BunkerScene", playerPosition: {
                    x: 5,
                    y: 5,
                    z: 10
                }, inventory: StateManager.inventory.serialize()})
            }
            
            const dialog: Dialogue = new Dialogue("e", "Parler", "Bonjour comment allez vous ?")
            const dialog1: Dialogue = new Dialogue("r", "Bien et vous ?", "Moi aussi, la vie est paisible.")
            dialog1.actions.push(new TeleportAction(new Vector3(10,10,10), new Vector3(0,0,0)))
            const dialog2: Dialogue = new Dialogue("t", "Mal", "C'est vrai, le monde va mal.")
            dialog.addNextDialog(dialog1);
            dialog.addNextDialog(dialog2);

            const serialized = JSON.stringify(instanceToPlain(dialog));
            console.log(serialized)
            const deserialized = plainToInstance(Dialogue, JSON.parse(serialized))

            const testNPC = NPC.CreateAsync("igor", this, new Vector3(5,1,0), "test_npc");

            StateManager.state = State.PLAYING;


            Pickable.CreateAsync("health_potion", this, new Vector3(-5,2,5), "health_potion", 5);
        });

    }
}
