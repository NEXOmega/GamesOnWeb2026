import { Vector3 } from '@babylonjs/core';
import { Transform } from 'class-transformer';

export function TransformVector3() {
    return function (target: any, key: string) {
        
        Transform(({ value }) => {
            if (!value) return undefined;
            return new Vector3(value.x, value.y, value.z);
        }, { toClassOnly: true })(target, key);

        Transform(({ value }) => {
            if (!value) return undefined;
            return { x: value.x, y: value.y, z: value.z };
        }, { toPlainOnly: true })(target, key);
        
    };
}