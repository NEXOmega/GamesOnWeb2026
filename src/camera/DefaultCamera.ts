import { UniversalCamera, Scene, Vector3 } from '@babylonjs/core';

// Camera used by scene at start
export default class Camera {
    public camera: UniversalCamera;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.camera = new UniversalCamera('camera1', new Vector3(0, 5, -10), scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl(canvas, false);

        this.camera.minZ = 0.45;
        this.camera.speed = 0.75;
        this.camera.angularSensibility = 1000;
    }

}
