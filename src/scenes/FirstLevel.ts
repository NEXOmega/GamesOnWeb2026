import { loadConfig } from './SceneUtils';
import BaseScene from './BaseScene';
import DroneEnemy from "../characters/DroneEnemy";
import IANavigation from "../characters/IANavigation";
;

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/first_level.json", this);

        await this.spawnEnemiesFromEmpties();

        this.playSceneMusic("./assets/sounds/ambient/djovan-sahara-sunset-oriental-relax-ambiance-desert-flute-oud-489155.mp3", true);
    }

    private async spawnEnemiesFromEmpties(): Promise<void> {
        // Debug
        console.log("=== TRANSFORM NODES ===");
        for (const node of this.transformNodes) {
            console.log(node.name, node.getAbsolutePosition());
        }
        console.log("======================");

        for (const node of this.transformNodes) {
            if (node.name.startsWith("drone")) {
                console.log("Spawn drone à", node.getAbsolutePosition());
                const drone = await DroneEnemy.CreateAsync(node.name, this, node.getAbsolutePosition().clone());
            }
            if (node.name.startsWith("robot")) {
                console.log("Spawn robot à", node.getAbsolutePosition());
                const robot = await IANavigation.CreateAsync(node.name, this, node.getAbsolutePosition().clone());
            }
        }
    }
}