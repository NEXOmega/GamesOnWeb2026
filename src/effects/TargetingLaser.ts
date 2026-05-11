import { Color3, Mesh, MeshBuilder, Observer, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import BaseScene from "../scenes/BaseScene";

export default class TargetingLaser {
    private beamMesh: Mesh;
    private beamMat: StandardMaterial;
    private scene: BaseScene;

    private aimColor: Color3 = new Color3(1, 0, 0); 
    private fireColor: Color3 = new Color3(0.8, 0.1, 1.0); 
    
    private isFiring: boolean = false;
    private fireObserver: Observer<Scene> | null = null; 

    constructor(id: string, scene: BaseScene) {
        this.scene = scene;
        
        this.beamMesh = MeshBuilder.CreateCylinder(id + "_beam", { height: 1, diameter: 1 }, scene);
        this.beamMesh.isPickable = false;
        this.beamMesh.alwaysSelectAsActiveMesh = true; 
        
        this.beamMesh.rotation.x = Math.PI / 2;
        this.beamMesh.bakeCurrentTransformIntoVertices();
        
        this.beamMat = new StandardMaterial(id + "_laserMat", scene);
        this.beamMesh.material = this.beamMat;
        
        this.beamMesh.isVisible = false;
    }

    public aim(origin: Vector3, target: Vector3, progress: number) {
        if (this.isFiring) return;

        this.beamMesh.isVisible = true;

        const distance = Vector3.Distance(origin, target);
        const direction = target.subtract(origin).normalize();

        this.beamMesh.position = origin.add(direction.scale(distance / 2));
        this.beamMesh.lookAt(target); 

        this.beamMat.emissiveColor = this.aimColor;
        this.beamMat.diffuseColor = this.aimColor;
        
        const thickness = 0.02 + Math.pow(progress, 6) * 0.04; 
        this.beamMesh.scaling = new Vector3(thickness, thickness, distance);
        this.beamMat.alpha = 0.3 + (progress * 0.7);
    }

    public fire(origin: Vector3, direction: Vector3, maxLength: number) {
        if (this.isFiring) return;
        this.isFiring = true;
        this.beamMesh.isVisible = true;

        this.beamMat.emissiveColor = this.fireColor;
        this.beamMat.diffuseColor = this.fireColor;
        this.beamMat.alpha = 1.0;

        const targetPoint = origin.add(direction);
        
        const startTime = performance.now();
        const travelDuration = 60;
        const lingerDuration = 150;
        const maxThickness = 0.15;

        this.fireObserver = this.scene.onBeforeRenderObservable.add(() => {
            const elapsed = performance.now() - startTime;

            if (elapsed < travelDuration) {
                const travelProgress = elapsed / travelDuration;
                const currentLength = maxLength * travelProgress;
                const currentThickness = 0.05 + (maxThickness - 0.05) * travelProgress;

                this.beamMesh.scaling = new Vector3(currentThickness, currentThickness, currentLength);
                this.beamMesh.position = origin.add(direction.scale(currentLength / 2));
                this.beamMesh.lookAt(targetPoint);

            } else if (elapsed < travelDuration + lingerDuration) {
                this.beamMesh.scaling = new Vector3(maxThickness, maxThickness, maxLength);
                this.beamMesh.position = origin.add(direction.scale(maxLength / 2));
                this.beamMesh.lookAt(targetPoint);
                
                const fadeProgress = (elapsed - travelDuration) / lingerDuration;
                this.beamMat.alpha = 1.0 - fadeProgress;

            } else {
                this.hideFire();
            }
        });
    }

    public stopAim() {
        if (!this.isFiring) {
            this.beamMesh.isVisible = false;
        }
    }

    private hideFire() {
        this.beamMesh.isVisible = false;
        this.isFiring = false;
        if (this.fireObserver) {
            this.scene.onBeforeRenderObservable.remove(this.fireObserver);
            this.fireObserver = null;
        }
    }

    public dispose() {
        this.hideFire(); 
        this.beamMesh.dispose();
        this.beamMat.dispose();
    }
}