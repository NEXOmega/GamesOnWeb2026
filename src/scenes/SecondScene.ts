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

export default class BunkerScene extends BaseScene {

    constructor(canvasElement: string, engine?: Engine) {
        super(canvasElement, engine, true);
    }

    async createScene(): Promise<void> {
        // 1. Caméra cinématique
        this.cinematicCamera = new CinematicCamera(this, this.canvas);

        // 2. Physique
        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);
        this.collisionsEnabled = true;
        this.enablePhysics(new Vector3(0, -100, 0), havokPlugin);

        // 3. Debug (Alt+I)
        window.addEventListener("keydown", (ev) => {
            if (ev.altKey && ev.key === 'i') {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show({ embedMode: true });
                }
            }
        });

        // 4. Retour menu (Escape)
        window.addEventListener("keydown", (ev) => {
            if (ev.key === "Escape") {
                this.onSwitchScene?.("menu");
            }
        });

        // 5. Lumières — ambiance sombre de bunker
        this.light = new HemisphericLight('ambient', new Vector3(0, 1, 0), this);
        this.light.intensity = 0.3; // faible pour un bunker

        // Lumière ponctuelle orange (comme une ampoule qui pendouille)
        const bulb = new PointLight('bulb', new Vector3(0, 4, 0), this);
        bulb.diffuse = new Color3(1, 0.7, 0.3);
        bulb.intensity = 0.8;
        bulb.range = 20;
    }

    async createEnvironment(): Promise<void> {
        // 6. Charge ton modèle de bunker
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Bunker_Level.glb",    // ← ton fichier 3D
            this
        );

        console.log("Bunker loaded");

        // 7. Ajoute la physique à chaque mesh du level
        meshes.forEach((mesh) => {
            if (mesh.getTotalVertices() > 0) {
                new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this);
                mesh.checkCollisions = true;
            }
        });

        // 8. Spawne le joueur
        Player.CreateAsync(this, new Vector3(0, 5, 0)).then((player) => {
            StateManager.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;

            // 9. Ajoute un NPC dans le bunker
            const dialog = new Dialogue("e", "Parler", "Bienvenue dans le bunker.");
            NPC.CreateAsync(this, new Vector3(3, 1, 2)).then(npc => {
                npc.dialog = dialog;
            });

            // 10. TODO : ajoute tes interactions, objets, ennemis ici

            StateManager.state = State.PLAYING;
        });
    }
}