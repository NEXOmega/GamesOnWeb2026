import { loadConfig } from './SceneUtils';
import BaseScene from './BaseScene';
import DroneEnemy from "../characters/DroneEnemy";
import IANavigation from "../characters/IANavigation";
import Pickable from "../entities/Pickable";

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/first_level.json", this);
        await this.spawnEnemies();
        await this.playSceneMusic("./assets/sounds/ambient/djovan-sahara-sunset-oriental-relax-ambiance-desert-flute-oud-489155.mp3", true);
    }

    private async spawnEnemies(): Promise<void> {
        // Le Character.glb du joueur crée des TransformNodes internes dans scene.transformNodes
        // (os d'armature, etc.). On les exclut en vérifiant qu'ils ne font PAS partie de la
        // hiérarchie du modèle du joueur.
        const playerModel = this.actualPlayer?.model;

        const spawnNodes = [...this.transformNodes].filter(node => {
            const name = node.name.toLowerCase();
            return (name.startsWith("drone") || name.startsWith("robot") || name.startsWith("crayon") || name.startsWith("param"))
                && !name.includes("_")
                && !(playerModel && node.isDescendantOf(playerModel));
        });

        console.log("Nodes à spawner:", spawnNodes.map(n => `${n.name} (parent: ${n.parent?.name ?? 'racine'})`));

        for (const node of spawnNodes) {
            node.computeWorldMatrix(true);
            const spawnPos = node.getAbsolutePosition().clone();
            const name = node.name.toLowerCase();

            console.log(`Spawn "${node.name}" -> X:${spawnPos.x.toFixed(2)} Y:${spawnPos.y.toFixed(2)} Z:${spawnPos.z.toFixed(2)}`);

            if (name.startsWith("drone")) {
                const dronePos = spawnPos.clone();
                dronePos.y += 3;
                await DroneEnemy.CreateAsync(node.name, this, dronePos);
            }

            if (name.startsWith("robot")) {
                const robot = await IANavigation.CreateAsync(node.name, this, spawnPos);
                await robot.CreateNavMesh(false);
                if (this.actualPlayer) {
                    robot.IaToPlayer(this.actualPlayer);
                }
            }

            if (name.startsWith("crayon")) {
                await Pickable.CreateAsync(node.name, this, spawnPos, "colors_pencil", 1);
            }

            if (name.startsWith("param")) {
                await Pickable.CreateAsync(node.name, this, spawnPos, "health_potion", 1);
            }
        }
    }
}