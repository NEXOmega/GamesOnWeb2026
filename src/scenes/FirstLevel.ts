import BaseScene from './BaseScene';
import { loadConfig } from './SceneUtils';

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/first_level.json", this);

        this.playSceneMusic("./assets/sounds/ambient/djovan-sahara-sunset-oriental-relax-ambiance-desert-flute-oud-489155.mp3", true)
    }
}
