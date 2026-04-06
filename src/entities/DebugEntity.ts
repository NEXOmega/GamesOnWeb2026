import { AbstractMesh, Scene } from '@babylonjs/core';
import Entity  from './Entity';
import BaseScene from '../scenes/BaseScene';

export default class DebugEntity extends Entity {
    constructor(mesh: AbstractMesh, scene: BaseScene) {
        super(mesh, scene);
    }
    
    public update(): void {
        this.mesh.rotation.y += 0.01;
    }
}