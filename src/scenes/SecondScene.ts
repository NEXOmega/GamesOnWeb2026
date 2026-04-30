import { HemisphericLight, PointLight, Vector3, MeshBuilder, HavokPlugin,
         PhysicsAggregate, PhysicsShapeType, Color3 } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";
import { Engine } from '@babylonjs/core';

import BaseScene from './BaseScene';
import CinematicCamera from '../camera/CinematicCamera';
import Player from '../characters/Player';
import { State, StateManager } from '../utils/StateManager';
import NPC from '../characters/NPC';
import Dialogue from '../dialogs/Dialogue';
import SceneManager from './SceneManager';

export default class BunkerScene extends BaseScene {

    async createEnvironment(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Bunker.glb",
            this
        );

        console.log("Bunker loaded");

        meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {
                new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this);
                mesh.checkCollisions = true;
            }
        });

        Player.CreateAsync(this, new Vector3(0, 5, 0)).then((player) => {
            this.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;

            NPC.CreateAsync("bunker_npc", this, new Vector3(3, 1, 2), "test_npc");

            StateManager.state = State.PLAYING;
        });
    }
}