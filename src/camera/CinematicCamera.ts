import { UniversalCamera, Scene, Vector3, Animation } from '@babylonjs/core';
import { Rotation } from '@babylonjs/havok';

// Camera used by scene at start
export default class CinematicCamera extends UniversalCamera {
    frameRate: number = 10;
    constructor(scene: Scene, canvas: HTMLCanvasElement) {
        super('cinematicCamera', new Vector3(2, 5, -10), scene);
        this.setTarget(Vector3.Zero());
        this.attachControl(canvas, false);

        this.minZ = 0;
        this.speed = 0;
        this.angularSensibility = 0;
    }

    public teleport(position: Vector3) {
        this.position = position;
    }

    public moveTo(position: Vector3, time: number) {
        const moveTo = new Animation("moveTo", "position", this.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: new Vector3(0,5,-10)
        })
        keyFrames.push({
            frame: time * this.frameRate,
            value: new Vector3(5,5,-10)
        })
        moveTo.setKeys(keyFrames);

        this.getScene().beginDirectAnimation(this, [moveTo], 0, time * this.frameRate, true);
    }

    public lookAt(position: Vector3) {
        const point = position.subtract(this.position);
        const yaw = Math.atan2(point.x, point.z);
        const distance = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.z, 2))
        const pitch = Math.atan(-point.y, )
        this.rotation = new Vector3(pitch, yaw, 0)
    }
}
