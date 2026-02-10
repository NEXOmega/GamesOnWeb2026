import { Scene, HemisphericLight, Vector3, MeshBuilder, HavokPlugin, PhysicsAggregate, PhysicsShapeType } from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";

import BaseScene from './BaseScene';
import DebugEntity from '../entities/DebugEntity';
import Camera from '../camera/DefaultCamera';
import Player from '../characters/Player';

export default class MyScene extends BaseScene {

    async createScene() : Promise<void> {
        this.scene = new Scene(this.engine);
        let camera = new Camera(this.scene, this.canvas);

        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);

        this.scene.collisionsEnabled = true;
        this.scene.enablePhysics(new Vector3(0, -200, 0), havokPlugin);

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
                const physicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0 }, this.scene);
                console.log("Physics aggregate created")
            }
        });

         Player.CreateAsync(this.scene, new Vector3(0, 10, 0)).then((player) => {
            console.log("Player created");
            this.entityManager.addEntity(player);
            this.scene.activeCamera = player.thirdPersonCamera;
        });
    }
}
