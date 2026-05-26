import { HemisphericLight, Vector3 } from '@babylonjs/core';

import BaseScene from './BaseScene';
import Player from '../characters/Player';
import { State, StateManager } from '../utils/StateManager';
import { loadConfig } from './SceneUtils';
import SoundManager from '../sounds/SoundManager';
import DroneEnemyCone from '../characters/DroneEnemyCone';

export default class StoryDebugScene extends BaseScene {

    async createScene() : Promise<void> {
        super.createScene()
        this.light = new HemisphericLight('light1', new Vector3(0,1,0), this);
    }

    async createEnvironment(): Promise<void> {
            await loadConfig("./assets/models/levels/story_debug.json", this);

        // this.playSceneMusic("./assets/sounds/jeune_morty_priilick.mp3", true)
    }
}
