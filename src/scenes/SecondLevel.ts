import { loadConfig } from './SceneUtils';
import BaseScene from './BaseScene';

export default class SecondLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/second_level.json", this);

        //this.actualPlayer.playerCamera.maxZ = 50
    }
}
