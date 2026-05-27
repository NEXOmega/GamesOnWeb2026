import { ArcRotateCamera, PhysicsRaycastResult, Scalar, Scene, TransformNode, Vector3 } from "@babylonjs/core";
import { StateManager } from "../utils/StateManager";
import Player from "../characters/Player";
import BaseScene from "../scenes/BaseScene";

export default class PlayerCamera extends ArcRotateCamera {
    desiredRadius: number;
    constructor(lockedTarget: TransformNode, scene: Scene, desiredRadius: number = 5) {
        super("playerCamera", -1.5, 1.2, 5, Vector3.Zero(), scene);
        this.desiredRadius = desiredRadius;

        this.attachControl(true);

        this.lockedTarget = lockedTarget;


        this.wheelPrecision = 200;
        this.lowerRadiusLimit = 0.2;
        this.upperBetaLimit = 3.14 / 2 + 0.2;
        this.minZ = 0.1;

        this.collisionRadius = new Vector3(0.5, 0.5, 0.5);
    }

    public handleCameraOcclusion(player:Player, scene: Scene): void {
        if (!this.desiredRadius) this.desiredRadius = this.radius;

        const engine = scene.getPhysicsEngine();
        if(!engine) return;

        const physicsPlugin = engine.getPhysicsPlugin();
        
        const targetNode = this.lockedTarget as TransformNode;
        const origin = targetNode.getAbsolutePosition();
        
        const camDir = this.position.subtract(origin).normalize();
        
        const targetEndPos = origin.add(camDir.scale(this.desiredRadius));
        
        const result = new PhysicsRaycastResult();
        
        physicsPlugin.raycast(origin, targetEndPos, result);

        const impostorMesh = (this._scene as BaseScene).actualPlayer.impostorMesh;
        const model = (this._scene as BaseScene).actualPlayer.model;

        // Cache le modèle si la caméra est trop proche (vue FPS)
        const FPS_THRESHOLD = 1.0;
        if (this.radius <= FPS_THRESHOLD) {
            model.getChildMeshes(false).forEach(m => m.visibility = 0);
            model.visibility = 0;
        } else {
            model.getChildMeshes(false).forEach(m => m.visibility = 1);
            model.visibility = 1;
        }

        if (result.hasHit) {
            const hitBody = result.body;
            if (hitBody.transformNode.uniqueId !== impostorMesh.uniqueId) {
                let newRadius = result.hitDistance - 0.25;
                if (newRadius < FPS_THRESHOLD) {
                    newRadius = FPS_THRESHOLD;
                    model.getChildMeshes(false).forEach(m => m.visibility = 0);
                    model.visibility = 0;
                }
                this.radius = newRadius;
                return;
            }
        }

        if (this.radius < this.desiredRadius) {
            this.radius = Scalar.Lerp(this.radius, this.desiredRadius, 0.1);
        }
    }
}