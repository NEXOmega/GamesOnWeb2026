import { Quaternion, Ray, Vector3 } from "@babylonjs/core";
import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";

/**
 * Utilisé pour lancer un laser en direction du target si la cible est a portée
 */
export default class RangedAttackBehavior extends Behavior {
    
    public declare entity: DroneEnemy; 
    
    private lastFireTime: number = 0;
    private isAiming: boolean = false;

    constructor(entity: DroneEnemy, priority: number) {
        super(entity, priority);
    }

    private hasLineOfSight(): boolean {
        if (!this.entity.target) return false;

        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const direction = targetPos.subtract(myPos).normalize();
        const distance = Vector3.Distance(myPos, targetPos);

        const ray = new Ray(myPos, direction, distance);
        
        const hit = this.entity.scene.pickWithRay(ray, (m) => 
            m !== this.entity.collider && 
            m !== this.entity.mesh && 
            !m.isDescendantOf(this.entity.mesh) &&
            m.name !== "skyBox" &&
            m.isPickable
        );

        if (hit && hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "CharacterTransform") {
            return false; 
        }

        return true;
    }

    public canStart(): boolean {
        if (!this.entity.target) return false;
        
        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const distance = Vector3.Distance(myPos, targetPos);
        
        return distance <= this.entity.attackRange && this.hasLineOfSight();
    }

    public canContinue(): boolean {
        if (!this.entity.target) return false;
        
        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const distance = Vector3.Distance(myPos, targetPos);
        
        return distance <= (this.entity.attackRange + 2) && this.hasLineOfSight();
    }

    public start(): void {
        this.isAiming = true;
        this.lastFireTime = performance.now();
    }

    public update(delta: number): void {
        if (!this.entity.target) return;

        const deltaSeconds = delta / 1000;

        const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
        this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));

        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const desiredDirection = targetPos.subtract(myPos).normalize();

        if (!this.entity.mesh.rotationQuaternion) this.entity.mesh.rotationQuaternion = Quaternion.Identity();
        const targetRotation = Quaternion.FromLookDirectionLH(desiredDirection, Vector3.Up());
        this.entity.mesh.rotationQuaternion = Quaternion.Slerp(this.entity.mesh.rotationQuaternion, targetRotation, 5 * deltaSeconds);

        const currentTime = performance.now();
        const timeAiming = currentTime - this.lastFireTime;
        const progress = Math.min(timeAiming / this.entity.fireCooldown, 1);

        if (this.isAiming) {
            this.entity.laser.aim(myPos, targetPos, progress);
        }

        if (timeAiming > this.entity.fireCooldown && this.isAiming) {
            this.executeFire(myPos, desiredDirection);
            this.lastFireTime = currentTime;
        }
    }

    public stop(): void {
        this.isAiming = false;
        this.entity.laser.stopAim(); 
    }

    private executeFire(origin: Vector3, direction: Vector3) {
        const ray = new Ray(origin, direction, this.entity.attackRange + 5);
        
        const hit = this.entity.scene.pickWithRay(ray, (m) => 
            m !== this.entity.collider && 
            m !== this.entity.mesh && 
            !m.isDescendantOf(this.entity.mesh) &&
            m.name !== "skyBox" &&
            m.isPickable
        );

        const hitDistance = (hit && hit.hit) ? hit.distance : this.entity.attackRange + 5;
        this.entity.laser.fire(origin, direction, hitDistance);

        if (hit && hit.hit && hit.pickedMesh && hit.pickedMesh.name === "CharacterTransform") {
            
            // On récupère le joueur depuis la scène
            const player = this.entity.scene.actualPlayer; 
            
            if (player) {
                console.log("Le joueur a été touché !");
                player.respawn()
                // Exemple : player.takeDamage(10);
                // Exemple : player.applyKnockback(direction);
            }
        }
    }
}