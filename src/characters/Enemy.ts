import Entity from '../entities/Entity';
import EntityBrain from './EntityBrain';
import Player from '../characters/Player';
import { AbstractMesh, Vector3 } from '@babylonjs/core';
import BaseScene from '../scenes/BaseScene';
import { Navigation } from './navigation/Navigation';

/**
 * Classe de base pour les enemies, utilise EntityBrain pour gérer les différents comportements grâce a un Goal Driven System
 */
export abstract class Enemy extends Entity {
    public brain: EntityBrain;
    public navigation?: Navigation;

    public target: Player | null = null;

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3) {
        super(id, mesh, scene, position);
        this.brain = new EntityBrain();
        this.scene.entityManager.addEntity(this);
    }

    public update(delta: number): void {
        super.update(delta);
        this.brain.update(delta);
        if (this.navigation) {
            this.navigation.update(delta);
        }
    }
}