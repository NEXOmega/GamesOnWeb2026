import { AbstractMesh, Vector3 } from '@babylonjs/core';
import Entity from '../entities/Entity';
import BaseScene from '../scenes/BaseScene';
import Player from '../characters/Player';

export enum EnemyState {
    IDLE,
    CHASE,
    ATTACK
}

export abstract class Enemy extends Entity {
    protected state: EnemyState = EnemyState.IDLE;
    protected player: Player | null;
    
    protected detectionRange: number = 20;
    protected attackRange: number = 8;

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, position);
        this.player = scene.actualPlayer;
        
        this.scene.entityManager.addEntity(this);
    }

    public update(delta: number): void {
        super.update(delta);
        
        if (!this.player) return;

        this.evaluateState();
        
        this.executeState(delta);
    }

    private evaluateState() {
        const distance = Vector3.Distance(this.mesh.getAbsolutePosition(), this.player.impostorMesh.getAbsolutePosition());

        switch(this.state) {
            case EnemyState.IDLE:
                if (distance < this.detectionRange) this.changeState(EnemyState.CHASE);
                break;
            case EnemyState.CHASE:
                if (distance > this.detectionRange) this.changeState(EnemyState.IDLE);
                else if (distance < this.attackRange) this.changeState(EnemyState.ATTACK);
                break;
            case EnemyState.ATTACK:
                if (distance > this.attackRange) this.changeState(EnemyState.CHASE);
                break;
        }
    }

    protected changeState(newState: EnemyState) {
        if (this.state === newState) return;
        this.state = newState;
    }

    private executeState(delta: number) {
        switch(this.state) {
            case EnemyState.IDLE:
                this.idleBehavior(delta);
                break;
            case EnemyState.CHASE:
                this.chaseBehavior(delta);
                break;
            case EnemyState.ATTACK:
                this.attackBehavior(delta);
                break;
        }
    }

    protected abstract idleBehavior(delta: number): void;
    protected abstract chaseBehavior(delta: number): void;
    protected abstract attackBehavior(delta: number): void;
}