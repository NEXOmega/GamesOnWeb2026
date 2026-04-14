import { Scene, HemisphericLight, DirectionalLight, Vector3, MeshBuilder, Color3, SceneLoader, CascadedShadowGenerator, PhysicsAggregate, PhysicsShapeType, AbstractMesh } from '@babylonjs/core';
import { SkyMaterial } from '@babylonjs/materials';
import { MapConfig } from './MapConfig';
import NPC from '../characters/NPC';
import Pickable from '../entities/Pickable';
import BaseScene from './BaseScene';

export async function loadEnvironmentFromConfig(configPath: string, scene: Scene) {
    const response = await fetch(configPath);
    if (!response.ok) throw new Error(`Impossible de charger la config map : ${configPath}`);
    const config: MapConfig = await response.json();

    console.log(`Génération de l'environnement pour : ${config.model}...`);

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

    const folderPath = configPath.substring(0, configPath.lastIndexOf('/') + 1); // Extrait "./models/"
    const { meshes } = await SceneLoader.ImportMeshAsync("", folderPath, config.model, scene);
    
    const rootMesh = meshes[0];

    if (config.scale !== 1) scaleMap(rootMesh, config.scale);
    if (config.centerMap) centerMap(rootMesh);

    const shadowGenerator = new CascadedShadowGenerator(config.lighting.shadowResolution, sun);
    shadowGenerator.bias = config.lighting.shadowBias;
    shadowGenerator.normalBias = config.lighting.shadowNormalBias;

    meshes.forEach((mesh) => {
        if (mesh.getTotalVertices() > 0 && mesh.name !== "skyBox") {
            mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(mesh);

            if (config.physicsEnabled) {
                new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, scene);
                mesh.checkCollisions = true;
            }
        }
    });

    console.log(`Map ${config.model} chargée et configurée !`);
    return { meshes, sun, ambient };
}


//TODO t oprevent multiple is else we could make a ObjectFactory which will register multiple type then take extras as entry and create objects
export async function loadMesh(scene: BaseScene, mesh: AbstractMesh) {
    const extras = mesh.metadata?.gltf?.extras;

    if (extras && extras.spawn_type) {
        if (extras.spawn_type === "item") {        
            Pickable.CreateAsync(
                extras.spawn_uuid, 
                scene, 
                mesh.getAbsolutePosition(),
                extras.type, 
                extras.quantity
            );
        } else if (extras.spawn_type === "npc") {
            NPC.CreateAsync(
                extras.spawn_uuid, 
                scene, 
                mesh.getAbsolutePosition(), 
                extras.dialog_id
            );
        }
        mesh.dispose();
    } else if (mesh.getTotalVertices() > 0) {
        const physicsAggregate = new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass: 0, restitution: 0 }, this);
        mesh.checkCollisions = true;
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
                rootMesh.position = new Vector3(-centerX, -boundingInfo.min.y, -centerZ);
        
                rootMesh.computeWorldMatrix(true);
}