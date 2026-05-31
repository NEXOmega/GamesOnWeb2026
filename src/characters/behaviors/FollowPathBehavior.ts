import { Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";
import DroneEnemyCone from "../DroneEnemyCone";

export enum PathMode {
    BACKWARD,
    BACK_FIRST
}

export default class FollowPathBehavior extends Behavior {
    
    public declare entity: DroneEnemy | DroneEnemyCone;

    private path: Vector3[];
    private mode: PathMode;
    
    private currentTargetIndex: number = 0;
    private pathDirection: number = 1;
    private isFinished: boolean = false;
    private readonly waypointReachDistance: number = 0.6;

    /**
     * @param path Un tableau de positions (Vector3)
     * @param mode Le comportement à la fin du chemin
     */
    constructor(entity: DroneEnemy | DroneEnemyCone, priority: number, path: Vector3[], mode: PathMode = PathMode.BACKWARD) {
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
        let targetPos = this.path[this.currentTargetIndex];

        if (Vector3.DistanceSquared(myPos, targetPos) <= this.waypointReachDistance * this.waypointReachDistance) {
            this.advanceToNextWaypoint();
            targetPos = this.path[this.currentTargetIndex];
        }

        this.entity.navigation.moveTo(targetPos, 0.5, this.waypointReachDistance, false);
    }

    private advanceToNextWaypoint() {
        this.currentTargetIndex += this.pathDirection;

        if (this.currentTargetIndex >= this.path.length) {
            switch (this.mode) {
                case PathMode.BACK_FIRST:
                    this.currentTargetIndex = 0;
                    break;
                case PathMode.BACKWARD:
                    this.pathDirection = -1;
                    this.currentTargetIndex = this.path.length - 2;
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
