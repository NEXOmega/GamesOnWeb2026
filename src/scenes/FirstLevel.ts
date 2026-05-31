import { loadConfig } from './SceneUtils';
import BaseScene from './BaseScene';
import DroneEnemy from "../characters/DroneEnemy";
import IANavigation from "../characters/IANavigation";
import Pickable from "../entities/Pickable";

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/first_level.json", this);
        //await this.spawnEnemies();
        await this.playSceneMusic("./assets/sounds/ambient/djovan-sahara-sunset-oriental-relax-ambiance-desert-flute-oud-489155.mp3", true);
    }

}