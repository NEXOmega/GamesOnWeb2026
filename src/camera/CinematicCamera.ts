import { UniversalCamera, Scene, Vector3 } from '@babylonjs/core';

// Camera used by scene at start
export default class CinematicCamera extends UniversalCamera {

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        super('cinematicCamera', new Vector3(0, 5, -10), scene);
        this.setTarget(Vector3.Zero());
        this.attachControl(canvas, false);

        this.minZ = 0.45;
        this.speed = 0.75;
        this.angularSensibility = 1000;
    }

    public teleport(position: Vector3) {
        this.position = position;
    }

}
