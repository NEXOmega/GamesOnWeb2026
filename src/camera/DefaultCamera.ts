import { FreeCamera, Scene, Vector3 } from '@babylonjs/core';

export default class Camera {
    public camera: FreeCamera;

    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        this.camera = new FreeCamera('camera1', new Vector3(0, 5, -10), scene);
        this.camera.setTarget(Vector3.Zero());
        this.camera.attachControl(canvas, false);

        this.camera.minZ = 0.45;
        this.camera.speed = 0.75;
        this.camera.angularSensibility = 1000;
    }

}
