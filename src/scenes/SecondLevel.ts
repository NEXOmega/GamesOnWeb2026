import BaseScene from './BaseScene';
import { loadConfig } from './SceneUtils';

export default class SecondLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/second_level.json", this);

        
        this.playSceneMusic("./assets/sounds/ambient/musicword-apocalypse-236302.mp3", true)
    }
}
