import { AbstractMesh, Scene, Vector3 } from '@babylonjs/core';

export default class Entity {
    public mesh: AbstractMesh;
    public scene: Scene;
    public childs = new Array<Entity>();

    constructor(mesh: AbstractMesh, scene: Scene, position?: Vector3, rotation?: Vector3, scale?: Vector3) {
        this.mesh = mesh;
        this.mesh.position = position || Vector3.Zero();
        this.mesh.rotation = rotation || Vector3.Zero();
        this.mesh.scaling = scale || Vector3.One();
        this.scene = scene;
    }

    public update(delta: number): void {
        // Logic for per-frame updates
    }

    public addChild(child: Entity): void {
        this.childs.push(child);
        child.mesh.parent = this.mesh;
    }

    public removeChild(child: Entity): void {
        const index = this.childs.indexOf(child);
        if (index !== -1) {
            this.childs.splice(index, 1);
            child.mesh.parent = null;
        }
    }

    public setPosition(position: Vector3): void {
        this.mesh.position = position;
    }

    public setRotation(rotation: Vector3): void {
        this.mesh.rotation = rotation;
    }

    public dispose(): void {
        if (this.mesh) {
            this.mesh.dispose();
        }
    }
}
