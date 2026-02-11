import { AbstractMesh, Scene } from '@babylonjs/core';
import Entity  from './Entity';

export default class DebugEntity extends Entity {
    constructor(mesh: AbstractMesh, scene: Scene) {
        super(mesh, scene);
    }
    
    public update(): void {
        this.mesh.rotation.y += 0.01;
    }
}