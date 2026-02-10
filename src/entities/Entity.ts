import { AbstractMesh, Vector3 } from '@babylonjs/core';

export default class Entity {
    public mesh: AbstractMesh;
    public position: Vector3;
    public rotation: Vector3;
    public scale: Vector3;

    constructor(mesh: AbstractMesh) {
        this.mesh = mesh;
        this.position = mesh.position;
        this.rotation = mesh.rotation;
        this.scale = mesh.scaling;
    }

    public update(delta: number): void {
        // Logic for per-frame updates
    }

    public dispose(): void {
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}
