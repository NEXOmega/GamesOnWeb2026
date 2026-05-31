import { Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import DroneEnemyCone from "../DroneEnemyCone";
import { Behavior } from "../Behavior";

export default class RandomStrollBehavior extends Behavior {
    public declare entity: DroneEnemy | DroneEnemyCone;

    private targetPosition: Vector3 | null = null;
    private waitTimer: number = 0;
    private travelTimer: number = 0;

    constructor(
        entity: DroneEnemy | DroneEnemyCone,
        priority: number,
        private readonly center: Vector3,
        private readonly radius: number = 8,
        private readonly verticalRange: number = 3,
        private readonly waitMinMs: number = 500,
        private readonly waitMaxMs: number = 1800,
        private readonly maxTravelMs: number = 6000
    ) {
        super(entity, priority);
    }

    public canStart(): boolean {
        return !this.entity.target && this.radius > 0;
    }

    public canContinue(): boolean {
        return !this.entity.target && this.radius > 0;
    }

    public start(): void {
        this.pickNewTarget();
    }

    public update(delta: number): void {
        if (!this.entity.navigation) return;

        if (this.waitTimer > 0) {
            this.waitTimer -= delta;
            const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
            this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));
            return;
        }

        if (!this.targetPosition) {
            this.pickNewTarget();
            return;
        }

        this.travelTimer += delta;
        const distanceSquared = Vector3.DistanceSquared(
            this.entity.collider.getAbsolutePosition(),
            this.targetPosition
        );

        if (distanceSquared <= 1.2 * 1.2 || this.travelTimer >= this.maxTravelMs) {
            this.targetPosition = null;
            this.waitTimer = this.randomBetween(this.waitMinMs, this.waitMaxMs);
            this.entity.navigation.stop();
            return;
        }

        this.entity.navigation.moveTo(this.targetPosition, 0.45, 1.2, true);
    }

    public stop(): void {
        this.targetPosition = null;
        this.waitTimer = 0;
        this.travelTimer = 0;
        this.entity.navigation?.stop();
    }

    private pickNewTarget(): void {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * this.radius;
        const height = this.randomBetween(-this.verticalRange, this.verticalRange);

        this.targetPosition = this.center.add(new Vector3(
            Math.cos(angle) * distance,
            height,
            Math.sin(angle) * distance
        ));
        this.travelTimer = 0;
    }

    private randomBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
