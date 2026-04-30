import { AbstractMesh, Color3, MeshBuilder, Observer, Ray, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";

import DroneEnemy from "../DroneEnemy";
import { Behavior } from "../Behavior";

export default class StealthDetectionBehavior extends Behavior {
    
    public declare entity: DroneEnemy;

    private visionCone: AbstractMesh;
    private visionMat: StandardMaterial;
    private visualObserver: Observer<Scene>;

    private detectionRange: number;
    private fov: number;

    constructor(entity: DroneEnemy, priority: number, detectionRange: number, fov: number) {
        super(entity, priority);

        this.detectionRange = detectionRange;
        this.fov = fov;

        const fovRatio = this.fov / (Math.PI * 2);

        this.visionCone = MeshBuilder.CreateDisc(this.entity.id + "_cone", { 
            radius: this.detectionRange, 
            arc: fovRatio, 
            tessellation: 32 
        }, this.entity.scene);
        
        this.visionCone.isPickable = false;
        this.visionCone.parent = this.entity.mesh; 
        this.visionCone.position.y = -1; 
        this.visionCone.rotation.x = Math.PI / 2; 
        
        this.visionCone.rotation.y = -(this.fov / 2) + Math.PI; 

        this.visionMat = new StandardMaterial(this.entity.id + "_coneMat", this.entity.scene);
        this.visionMat.backFaceCulling = false;
        this.visionMat.alpha = 0.2;
        this.visionCone.material = this.visionMat;

        this.visualObserver = this.entity.scene.onBeforeRenderObservable.add(() => {
            if (this.entity.target) {
                this.visionMat.emissiveColor.copyFromFloats(1, 0, 0); // Rouge !
            } else {
                this.visionMat.emissiveColor.copyFromFloats(1, 1, 0); // Jaune
            }
        });
    }

    public canStart(): boolean {
        if (this.entity.target) return false;

        const player = this.entity.scene.actualPlayer;
        if (!player) return false;

        const myPos = this.entity.collider.getAbsolutePosition();
        const playerPos = player.impostorMesh.getAbsolutePosition();
        const distance = Vector3.Distance(myPos, playerPos);

        if (distance > this.detectionRange) return false;

        const directionToPlayer = playerPos.subtract(myPos).normalize();
        
        const forward = this.entity.mesh.forward.scale(-1); 
        const dot = Vector3.Dot(forward, directionToPlayer);
        const angle = Math.acos(Math.max(-1, Math.min(1, dot))); 

        if (angle > this.fov / 2) {
            return false;
        }

        const ray = new Ray(myPos, directionToPlayer, distance);
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

    public canContinue(): boolean {
        return false; 
    }

    public start(): void {
        console.log(`[${this.entity.id}] Joueur repéré par le cône !`);
        this.entity.target = this.entity.scene.actualPlayer;
    }

    public update(delta: number): void {}

    public dispose() {
        this.entity.scene.onBeforeRenderObservable.remove(this.visualObserver);
        this.visionCone.dispose();
        this.visionMat.dispose();
    }
}