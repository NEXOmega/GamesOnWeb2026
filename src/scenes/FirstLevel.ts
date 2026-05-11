import { loadConfig } from './SceneUtils';
import BaseScene from './BaseScene';

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/first_level.json", this);
    }
}
