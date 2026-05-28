import { Vector3 } from "@babylonjs/core";


export function getRotationFromPositions(from: Vector3, to: Vector3): Vector3 {
    
        const point = to.subtract(from);
        const yaw = Math.atan2(point.x, point.z);
        const distance = Math.sqrt(Math.pow(point.x, 2) + Math.pow(point.z, 2))
        const pitch = Math.atan(-point.y, )
        return new Vector3(pitch, yaw, 0);
}