import { Quaternion, Ray, Vector3 } from "@babylonjs/core";
import { Navigation } from "./Navigation";
import DroneEnemy from "../DroneEnemy";

export default class FlyingNavigation extends Navigation {
    protected declare entity: DroneEnemy;

    private avoidanceRadius: number = 4.0;
    private rotationSpeed: number = 5.0;

    constructor(entity: DroneEnemy) {
        super(entity);
    }

    public update(delta: number): void {
        const deltaSeconds = delta / 1000;
        const myPos = this.entity.collider.getAbsolutePosition();

        if (!this.isNavigating || !this.targetPosition) {
            const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
            this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));
            return;
        }

        const distanceToTarget = Vector3.Distance(myPos, this.targetPosition);
        if (distanceToTarget <= this.stoppingDistance) {
            this.stop();
            return;
        }

        let desiredDirection = this.targetPosition.subtract(myPos).normalize();

        if (this.avoidObstacles) {
            const ray = new Ray(myPos, desiredDirection, this.avoidanceRadius);
            const hit = this.entity.scene.pickWithRay(ray, (m) =>
                m !== this.entity.collider &&
                m !== this.entity.mesh &&
                !m.isDescendantOf(this.entity.mesh) &&
                m.name !== "skyBox" &&
                m.name !== "CharacterTransform" &&
                m.isPickable
            );

            if (hit && hit.hit) {
                const hitNormal = hit.getNormal(true);
                if (hitNormal) desiredDirection = desiredDirection.add(hitNormal.scale(2)).normalize();
            }
        }

        if (!this.entity.mesh.rotationQuaternion) this.entity.mesh.rotationQuaternion = Quaternion.Identity();

        const horizontalLookDirection = new Vector3(desiredDirection.x, 0, desiredDirection.z);
        if (horizontalLookDirection.lengthSquared() > 0.0001) {
            horizontalLookDirection.normalize();
            const targetRotation = Quaternion.FromLookDirectionLH(horizontalLookDirection, Vector3.Up());
            this.entity.mesh.rotationQuaternion = Quaternion.Slerp(this.entity.mesh.rotationQuaternion, targetRotation, this.rotationSpeed * deltaSeconds);
        }

        const finalSpeed = this.entity.moveSpeed * this.speedMultiplier;
        const velocity = desiredDirection.scale(finalSpeed);
        this.entity.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, velocity.y, velocity.z));
    }
}
