import { Scene, HemisphericLight, Vector3, MeshBuilder, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ExecuteCodeAction, ActionManager } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";

import BaseScene from './BaseScene';
import DebugEntity from '../entities/DebugEntity';
import Camera from '../camera/DefaultCamera';
import Player from '../characters/Player';
import CollisionEntity from '../entities/CollisionEntity';
import { StateManager } from '../utils/StateManager';
import InteractionEntity from '../entities/InteractionEntity';
import * as TitleAnimation from '../gui/title/TitleAnimation'

export default class MyScene extends BaseScene {

    async createScene() : Promise<void> {
        this.scene = new Scene(this.engine);
        let camera = new Camera(this.scene, this.canvas);

        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);

        this.scene.collisionsEnabled = true;
        this.scene.enablePhysics(new Vector3(0, -100, 0), havokPlugin);
        // Hide/show the Inspector with Alt+I
        window.addEventListener("keydown", (ev) => {
            if (ev.altKey && ev.key === 'i') {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show({ embedMode: true });
                }
            }
        });

        this.light = new HemisphericLight('light1', new Vector3(0,1,0), this.scene);


    }

    async createEnvironment(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Prototype_Level.glb",
            this.scene
        );

        console.log("Level loaded")
        
        meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {
                const physicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this.scene);
                console.log("Physics aggregate created")
            }
        });

        Player.CreateAsync(this.scene, new Vector3(0, 10, 0)).then((player) => {
            StateManager.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.scene.activeCamera = player.thirdPersonCamera;

            let collisionEntity = new InteractionEntity(player, 1, this.scene);
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
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez Zdahir", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez Samsou", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez L'albanais", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Jow Dash", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Le T", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Brakav", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Drixav", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Tromax", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Ricky La Pénave", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Jonhy L'Horloger", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez Pundal", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Guendoul", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Belbit", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Pollux", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez Délivrer", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez Vos Chakra", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez les WC", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez l'alsace", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez AAAAAAAA", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Nike", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez La chambre avant midi", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez La Bastille", 150, 150, 0))
                player.playerHud.title.enqueue(player.playerHud.title.createFadeTitle("Libérez de l'espace de stockage afin de pouvoir installer le software", 150, 400, 0))
            }
            this.entityManager.addEntity(collisionEntity);
        });
    }
}
