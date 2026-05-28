import { Animation,Scene, UniversalCamera, Vector3 } from '@babylonjs/core';

import { getRotationFromPositions } from '../utils/3DUtils'

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

    public moveTo(fromPosition: Vector3, toPosition: Vector3, fromRotation: Vector3, toRotation: Vector3, time: number, onAnimationEnd = undefined) {
        const moveTo = new Animation("moveTo", "position", this.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const rotateTo = new Animation("moveTo", "rotation", this.frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CYCLE);
        const moveKeyFrames = [];
        moveKeyFrames.push({
            frame: 0,
            value: fromPosition
        })
        moveKeyFrames.push({
            frame: time * this.frameRate,
            value: toPosition
        })
        moveTo.setKeys(moveKeyFrames);
        const rotateKeyFrames = [];
        rotateKeyFrames.push({
            frame: 0,
            value: fromRotation
        })
        rotateKeyFrames.push({
            frame: time * this.frameRate,
            value: toRotation
        })
        rotateTo.setKeys(rotateKeyFrames);

        const animatable = this.getScene().beginDirectAnimation(this, [moveTo, rotateTo], 0, time * this.frameRate, false);
        if(onAnimationEnd != undefined)
            animatable.onAnimationEnd = onAnimationEnd;
    }

    public lookAt(position: Vector3) {
        this.rotation = getRotationFromPositions(this.position, position)
    }
    
}
