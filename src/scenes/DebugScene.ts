import { HemisphericLight, Vector3 } from '@babylonjs/core';

import BaseScene from './BaseScene';
import Player from '../characters/Player';
import { loadConfig } from './SceneUtils';
import IANavigation from "../characters/IANavigation";
import DroneEnemy from "../characters/DroneEnemy";
export default class DebugScene extends BaseScene {
    public posPlayer: Player;

    async createScene(): Promise<void> {
        super.createScene();
        this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this);
    }

    async createEnvironment(): Promise<void> {
        await loadConfig("./assets/models/debug_level.json", this);
        this.posPlayer = this.actualPlayer as Player;

        const enemy = await IANavigation.CreateAsync(
            "Enemy1",
            this,
            new Vector3(12, 1, 0),
            Vector3.Zero(),
            Vector3.One(),
        );
        await enemy.CreateNavMesh(false);
        enemy.IaToPlayer(this.posPlayer);
        this.entityManager.addEntity(enemy);


        await DroneEnemy.CreateAsync(
            "Drone1",
            this,
            new Vector3(-8, 4, 5),
        );

    }
}