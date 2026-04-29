import { Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";
import { Enemy } from "../Enemy";

/**
 * Permet de détecter le joueur et d'appliquer le target a notre Enemy pour qu'il puisse ensuite le target dans les prochains comportements.
 */
export default class FindPlayerTargetBehavior extends Behavior {
    
    public declare entity: Enemy;
    public detectionRange: number;

    constructor(entity: Enemy, priority: number, detectionRange: number) {
        super(entity, priority);
        this.detectionRange = detectionRange;
    }

    public canStart(): boolean {
        if (this.entity.target) return false;

        const player = this.entity.scene.actualPlayer;
        if (!player) return false;

        const distance = Vector3.Distance(
            this.entity.mesh.getAbsolutePosition(), 
            player.impostorMesh.getAbsolutePosition()
        );

        return distance < this.detectionRange;
    }

    public canContinue(): boolean {
        return false; 
    }

    public start(): void {
        console.log(`[${this.entity.id}] Joueur détecté !`);
        this.entity.target = this.entity.scene.actualPlayer;
    }

    public update(delta: number): void {
    }
}