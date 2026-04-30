import { Quaternion, Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";
import DroneEnemyCone from "../DroneEnemyCone";

// Les 3 modes de patrouille que tu as demandés
export enum PathMode {
    LOOP,       // Recommence au premier point (Boucle)
    PING_PONG,  // Fait demi-tour et refait le chemin à l'envers
    ONCE        // S'arrête définitivement au dernier point
}

export default class FollowPathBehavior extends Behavior {
    
    public declare entity: DroneEnemyCone;

    private path: Vector3[];
    private mode: PathMode;
    
    private currentTargetIndex: number = 0;
    private pathDirection: number = 1;
    private isFinished: boolean = false;

    /**
     * @param path Un tableau de positions (Vector3)
     * @param mode Le comportement à la fin du chemin
     */
    constructor(entity: DroneEnemyCone, priority: number, path: Vector3[], mode: PathMode = PathMode.LOOP) {
        super(entity, priority);
        this.path = path;
        this.mode = mode;
    }

    public canStart(): boolean {
        if (this.entity.target) return false;
        
        if (this.path.length < 2 || this.isFinished) return false;
        
        return true;
    }

    public canContinue(): boolean {
        if (this.entity.target) return false;
        
        return !this.isFinished;
    }

    public update(delta: number): void {
        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.path[this.currentTargetIndex];

        this.entity.navigation.moveTo(targetPos, 0.5, 1.5);

        if (!this.entity.navigation.isMoving()) {
            this.advanceToNextWaypoint();
        }
    }

    private advanceToNextWaypoint() {
        this.currentTargetIndex += this.pathDirection;

        if (this.currentTargetIndex >= this.path.length) {
            switch (this.mode) {
                case PathMode.LOOP:
                    this.currentTargetIndex = 0;
                    break;
                case PathMode.PING_PONG:
                    this.pathDirection = -1;
                    this.currentTargetIndex = this.path.length - 2;
                    break;
                case PathMode.ONCE:
                    this.currentTargetIndex = this.path.length - 1;
                    this.isFinished = true;
                    break;
            }
        } 
        else if (this.currentTargetIndex < 0) {
            this.pathDirection = 1; 
            this.currentTargetIndex = 1;
        }
    }

    public stop(): void {
        this.entity.navigation.stop();
    }
}