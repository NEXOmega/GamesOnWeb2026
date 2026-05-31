import { Scene, HemisphericLight, DirectionalLight, Vector3, MeshBuilder, Color3, SceneLoader, CascadedShadowGenerator, PhysicsAggregate, PhysicsShapeType, AbstractMesh, Quaternion } from '@babylonjs/core';
import { SkyMaterial } from '@babylonjs/materials';
import { MapConfig } from './MapConfig';
import NPC from '../characters/NPC';
import Pickable from '../entities/Pickable';
import BaseScene from './BaseScene';
import Interactable from '../entities/Interactable';

import Player from '../characters/Player';
import { State, StateManager } from '../utils/StateManager';
import DroneEnemy from '../characters/DroneEnemy';
import IANavigation from '../characters/IANavigation';

export async function loadConfig(configPath: string, scene: BaseScene) {
    const response = await fetch(configPath);
    if (!response.ok) throw new Error(`Impossible de charger la config map : ${configPath}`);
    const config: MapConfig = await response.json();

    let spawnPos = new Vector3(0, 10, 0);

    if (config.playerSpawn) {
        spawnPos = new Vector3(config.playerSpawn.x, config.playerSpawn.y, config.playerSpawn.z);
    }

    // Ne crée le joueur que si la scène n'en a pas déjà un
    if (!scene.actualPlayer) {
        const player = await Player.CreateAsync(scene, spawnPos);
        scene.actualPlayer = player;
        scene.entityManager.addEntity(player);
    }
    scene.activeCamera = scene.actualPlayer.playerCamera;

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
    const skyMaterial = new SkyMaterial("skyMaterial", scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.luminance = config.sky.luminance;
    skyMaterial.turbidity = config.sky.turbidity;
    skyMaterial.rayleigh = config.sky.rayleigh;
    skyMaterial.mieCoefficient = config.sky.mieCoefficient;
    skyMaterial.useSunPosition = true;
    
    const sunPos = new Vector3(config.sky.sunPosition.x, config.sky.sunPosition.y, config.sky.sunPosition.z);
    skyMaterial.sunPosition = sunPos;
    skybox.material = skyMaterial;
    skybox.infiniteDistance = true;

    const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
    ambient.intensity = config.lighting.ambientIntensity;

    const sun = new DirectionalLight("sun", sunPos.negate(), scene);
    sun.position = sunPos;
    sun.setDirectionToTarget(Vector3.Zero());
    sun.intensity = config.lighting.sunIntensity;

    if (config.fog.enabled) {
        scene.fogMode = Scene.FOGMODE_EXP;
        scene.fogDensity = config.fog.density;
        scene.fogColor = new Color3(config.fog.color[0], config.fog.color[1], config.fog.color[2]);
    }

    const folderPath = configPath.substring(0, configPath.lastIndexOf('/') + 1);
    const { meshes } = await SceneLoader.ImportMeshAsync("", folderPath, config.model, scene);
    
    const rootMesh = meshes.find(mesh => mesh.name === "__root__") ?? meshes[0];

    if (config.scale !== 1) scaleMap(rootMesh, config.scale);
    if (config.centerMap) centerMap(rootMesh);
    refreshWorldMatrices(rootMesh);

    const shadowGenerator = new CascadedShadowGenerator(config.lighting.shadowResolution, sun);
    shadowGenerator.bias = config.lighting.shadowBias;
    shadowGenerator.normalBias = config.lighting.shadowNormalBias;

    const spawnMeshes = meshes.filter(hasSpawnMetadata);
    for (const mesh of meshes) {
        loadMesh(scene, mesh, shadowGenerator, config.physicsEnabled);
    }

    const robotCount = spawnMeshes.filter(
        (m) => m.metadata?.gltf?.extras?.spawn_type === "robot",
    ).length;
    if (robotCount > 0) {
        await IANavigation.InitNavigation(scene, robotCount);
    }

    for (const mesh of spawnMeshes) {
        await loadSpawnMesh(scene, mesh);
    }

    StateManager.state = State.PLAYING;
    return { meshes, sun, ambient };
}

function hasSpawnMetadata(mesh: AbstractMesh): boolean {
    return Boolean(mesh.metadata?.gltf?.extras?.spawn_type);
}

async function loadSpawnMesh(scene: BaseScene, mesh: AbstractMesh) {
    if (!mesh.isEnabled()) {
        mesh.dispose();
        return;
    }

    mesh.computeWorldMatrix(true);
    const extras = mesh.metadata?.gltf?.extras || {};
    const spawnPos = new Vector3();
    const spawnRotation = new Quaternion();
    mesh.getWorldMatrix().decompose(undefined, spawnRotation, spawnPos);
    console.log(`[SceneUtils] Spawn ${mesh.name}`)

    if (extras.spawn_type === "item") {
        await Pickable.CreateAsync(extras.spawn_uuid, scene, spawnPos, extras.type, extras.quantity);
        mesh.dispose();
    } else if (extras.spawn_type === "npc") {
        console.log(`[SceneUtils] Spawn NPC ${extras.spawn_uuid} from ${mesh.name} at (${spawnPos.x.toFixed(2)}, ${spawnPos.y.toFixed(2)}, ${spawnPos.z.toFixed(2)})`);
        await NPC.CreateAsync(extras.spawn_uuid, scene, spawnPos, extras.dialog_id, spawnRotation);
        mesh.dispose();
    } else if (extras.spawn_type === "interactable") {
        // extras.model_path : chemin relatif depuis /assets/models/ (ex: "npc/solar_panel.glb")
        await Interactable.CreateAsync(extras.spawn_uuid, scene, mesh, extras.interaction_action, extras.model_path);
    } else if (extras.spawn_type === "drone") {
        console.log("[SceneUtils] Spawn drone")
        const dronePos = spawnPos.add(new Vector3(0, 3, 0));
        await DroneEnemy.CreateAsync(
            extras.spawn_uuid,
            scene,
            dronePos,
            getNumberExtra(extras.stroll_radius, 16),
            getNumberExtra(extras.stroll_vertical_range, 3)
        );
        mesh.dispose();
    } else if (extras.spawn_type === "robot") {
        const robot = await IANavigation.CreateAsync(extras.spawn_uuid, scene, spawnPos);
        if (scene.actualPlayer) {
            robot.IaToPlayer(scene.actualPlayer);
        }
        mesh.dispose();
    }
    
}

function getNumberExtra(value: unknown, fallback: number): number {
    return typeof value === "number" ? value : fallback;
}

export async function loadMesh(
    scene: BaseScene, 
    mesh: AbstractMesh, 
    shadowGenerator?: CascadedShadowGenerator, 
    physicsGlobalEnabled: boolean = true
) {

    if (!mesh.isEnabled()) {
        mesh.dispose(); 
        return;
    }
    const extras = mesh.metadata?.gltf?.extras || {};

    if (extras && extras.spawn_type) return;

    if (mesh.getTotalVertices() > 0 && mesh.name !== "skyBox") {

        mesh.freezeWorldMatrix();
        mesh.doNotSyncBoundingInfo = true;

        const physicsType = extras.physics_type || "mesh"; 
        const vertexCount = mesh.getTotalVertices();

        // OPTIMISATION GPU : Si le mesh est trop lourd (> 100k vertices), 
        // on évite de lui faire projeter des ombres pour sauver le framerate
        const isExtremelyHeavy = vertexCount > 100000;

         if (physicsType === "none") {
            if (shadowGenerator) {
                mesh.receiveShadows = true;
                if (!isExtremelyHeavy) shadowGenerator.addShadowCaster(mesh);
            }
        }
        else {
            if (shadowGenerator) {
                mesh.receiveShadows = true;
                if (!isExtremelyHeavy) shadowGenerator.addShadowCaster(mesh);
            }
            if (physicsGlobalEnabled) {
                let shape = PhysicsShapeType.MESH;
                if (physicsType === "box") shape = PhysicsShapeType.BOX;
                else if (physicsType === "sphere") shape = PhysicsShapeType.SPHERE;
                else if (physicsType === "hull") shape = PhysicsShapeType.CONVEX_HULL;

                new PhysicsAggregate(mesh, shape, { mass: 0, restitution: 0 }, scene);
                mesh.checkCollisions = true;
            }
        }
    }
}

export function scaleMap(rootMesh: AbstractMesh, scaleFactor: number) {
    rootMesh.scaling = new Vector3(scaleFactor, scaleFactor, scaleFactor);
    rootMesh.computeWorldMatrix(true);
}

export function centerMap(rootMesh: AbstractMesh) {
    const boundingInfo = rootMesh.getHierarchyBoundingVectors();
    const centerX = (boundingInfo.max.x + boundingInfo.min.x) / 2;
    const centerZ = (boundingInfo.max.z + boundingInfo.min.z) / 2;
    // On place le bas du modèle à Y=0 pour que le joueur ne tombe pas
    rootMesh.position = new Vector3(-centerX, -boundingInfo.min.y, -centerZ);
    rootMesh.computeWorldMatrix(true);
}

function refreshWorldMatrices(rootMesh: AbstractMesh) {
    rootMesh.computeWorldMatrix(true);
    for (const node of rootMesh.getChildTransformNodes(false)) {
        node.computeWorldMatrix(true);
    }
}
