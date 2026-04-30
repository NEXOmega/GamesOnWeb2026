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
import { loadMesh } from './SceneUtils';
import SoundManager from '../sounds/SoundManager';
import DroneEnemy from '../characters/DroneEnemy';
import DroneEnemyCone from '../characters/DroneEnemyCone';

export default class DebugScene extends BaseScene {

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
                    this.activeCamera = this.actualPlayer.playerCamera;
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

        await Player.CreateAsync(this, new Vector3(0, 10, 0)).then((player) => {
            this.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;
            SoundManager.setListenerToCamera(this.activeCamera);

            DroneEnemyCone.CreateAsync("drone_test", this, new Vector3(-7,2,5));

            StateManager.state = State.PLAYING;
        });
        
        meshes.forEach((mesh) => {
            loadMesh(this, mesh);
        });

        // this.playSceneMusic("./assets/sounds/jeune_morty_priilick.mp3", true)
    }
}
