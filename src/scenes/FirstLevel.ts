import { Vector3 } from '@babylonjs/core';
import { loadEnvironmentFromConfig } from './SceneUtils';
import BaseScene from './BaseScene';
import { State, StateManager } from '../utils/StateManager';
import Player from '../characters/Player';

export default class FirstLevel extends BaseScene {

    async createEnvironment(): Promise<void> {
        await Player.CreateAsync(this, new Vector3(0, 100, 0)).then((player) => {
            this.actualPlayer = player;
            this.entityManager.addEntity(player);
            this.activeCamera = player.playerCamera;

            StateManager.state = State.PLAYING;
        });

        await loadEnvironmentFromConfig("./models/first_level.json", this);
    }
}
