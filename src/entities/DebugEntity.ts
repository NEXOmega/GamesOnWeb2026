import { AbstractMesh } from '@babylonjs/core';
import Entity  from './Entity';

export default class DebugEntity extends Entity {
    constructor(mesh: AbstractMesh) {
        super(mesh);
    }
    
    public update(): void {
        this.mesh.rotation.y += 0.01;
    }
}