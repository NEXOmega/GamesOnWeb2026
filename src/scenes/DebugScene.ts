import { HemisphericLight, Vector3 } from '@babylonjs/core';

import BaseScene from './BaseScene';
import Player from '../characters/Player';
import { State, StateManager } from '../utils/StateManager';
import { loadEnvironmentFromConfig, loadMesh } from './SceneUtils';
import SoundManager from '../sounds/SoundManager';
import DroneEnemyCone from '../characters/DroneEnemyCone';

export default class DebugScene extends BaseScene {

    async createScene() : Promise<void> {
        super.createScene()
        this.light = new HemisphericLight('light1', new Vector3(0,1,0), this);
    }

    async createEnvironment(): Promise<void> {

        await Player.CreateAsync(this, new Vector3(0, 10, 0)).then((player) => {
            this.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;
            SoundManager.setListenerToCamera(this.activeCamera);

            DroneEnemyCone.CreateAsync("drone_test", this, new Vector3(-7,2,5));

            StateManager.state = State.PLAYING;
        });
        
        const environmentData = await loadEnvironmentFromConfig("./models/debug_level.json", this);

        // this.playSceneMusic("./assets/sounds/jeune_morty_priilick.mp3", true)
    }
}
