import { Quaternion, Ray, Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";

/**
 * Comportement permetant de chasser le joueur, utilisé pour les drone seulement.
 */
export default class ChaseTargetBehavior extends Behavior {
    
    public declare entity: DroneEnemy;
    public detectionRange: number;

    constructor(entity: DroneEnemy, priority: number, detectionRange: number) {
        super(entity, priority);
        this.detectionRange = detectionRange;
    }

    public canStart(): boolean {
        return this.entity.target !== null;
    }

    public canContinue(): boolean {
        if (!this.entity.target) return false;

        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const distance = Vector3.Distance(myPos, targetPos);

        if (distance > this.detectionRange * 1.5) {
            console.log(`[${this.entity.id}] Cible perdue...`);
            this.entity.target = null;
            return false;
        }

        return true;
    }

    public update(delta: number): void {
        if (!this.entity.target) return;

        const deltaSeconds = delta / 1000;
        const myPos = this.entity.collider.getAbsolutePosition();
        const playerPos = this.entity.target.impostorMesh.getAbsolutePosition();

        const camForward = (this.entity.target as any).playerCamera.getForwardRay().direction;
        const playerForward = new Vector3(camForward.x, 0, camForward.z).normalize();

        const idealPos = playerPos.add(playerForward.scale(this.entity.attackRange * 0.8));
        idealPos.y = playerPos.y + 2; 

        let desiredDirection = idealPos.subtract(myPos).normalize();

        const ray = new Ray(myPos, desiredDirection, 4);
        const hit = this.entity.scene.pickWithRay(ray, (m) => 
            m !== this.entity.collider && 
            m !== this.entity.mesh && 
            !m.isDescendantOf(this.entity.mesh) && 
            m.name !== "skyBox" &&
            m.name !== "CharacterTransform" &&
            m.isPickable
        );

        if (hit && hit.hit) {
            const hitNormal = hit.getNormal(true)!;
            desiredDirection = desiredDirection.add(hitNormal.scale(2)).normalize();
        }

        if (!this.entity.mesh.rotationQuaternion) this.entity.mesh.rotationQuaternion = Quaternion.Identity();
        const directionToPlayer = playerPos.add(new Vector3(0,1,0)).subtract(myPos).normalize();
        const targetRotation = Quaternion.FromLookDirectionLH(directionToPlayer, Vector3.Up());
        this.entity.mesh.rotationQuaternion = Quaternion.Slerp(this.entity.mesh.rotationQuaternion, targetRotation, 5 * deltaSeconds);

        const velocity = desiredDirection.scale(this.entity.moveSpeed);
        this.entity.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, velocity.y, velocity.z)); 
    }

    public stop(): void {
        const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
        this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.5));
    }
}