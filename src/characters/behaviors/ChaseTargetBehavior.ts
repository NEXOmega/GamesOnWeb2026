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

        const playerPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const camForward = (this.entity.target as any).playerCamera.getForwardRay().direction;
        const playerForward = new Vector3(camForward.x, 0, camForward.z).normalize();

        const idealPos = playerPos.add(playerForward.scale(this.entity.attackRange * 0.8));
        idealPos.y = playerPos.y + 2; 

        this.entity.navigation.moveTo(idealPos, 1.0, 0);
    }

    public stop(): void {
        this.entity.navigation.stop();
    }
}