import { HemisphericLight, Vector3 } from '@babylonjs/core';

import BaseScene from './BaseScene';
import Player from '../characters/Player';
import { loadConfig } from './SceneUtils';
import IANavigation from "../characters/IANavigation";
import DroneEnemy from "../characters/DroneEnemy";
import Pickable from "../entities/Pickable";
export default class DebugScene extends BaseScene {
    public posPlayer: Player;

    async createScene(): Promise<void> {
        super.createScene();
        this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this);
    }

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/levels/debug_level.json", this);

    }
}