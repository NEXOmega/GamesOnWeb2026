import { Vector3 } from "@babylonjs/core";
import { Enemy } from "../Enemy";

/**
 * Permet de gérer le déplacement des entitées
 */
export abstract class Navigation {
    protected entity: Enemy;
    protected targetPosition: Vector3 | null = null;
    protected isNavigating: boolean = false;
    protected speedMultiplier: number = 1.0;
    protected stoppingDistance: number = 1.5;

    constructor(entity: Enemy) {
        this.entity = entity;
    }

    /**
     * Demande à l'entité de se déplacer vers un point
     */
    public moveTo(target: Vector3, speedMultiplier: number = 1.0, stoppingDistance: number = 1.5): void {
        this.targetPosition = target;
        this.speedMultiplier = speedMultiplier;
        this.stoppingDistance = stoppingDistance;
        this.isNavigating = true;
    }

    /**
     * Stoppe le mouvement en cours
     */
    public stop(): void {
        this.isNavigating = false;
        this.targetPosition = null;
    }

    public isMoving(): boolean {
        return this.isNavigating;
    }

    /**
     * Appelé à chaque frame par l'entité pour mettre à jour la physique/rotation.
     */
    public abstract update(delta: number): void;
}