import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";

import BaseScene from './BaseScene';
import { loadConfig } from './SceneUtils';

export default class BunkerScene extends BaseScene {

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/bunker.json", this);

        this.playSceneMusic("./assets/sounds/ambient/iuvenis-subterranean-serenade-serenata-subterranea-288134.mp3", true)
    }
}
