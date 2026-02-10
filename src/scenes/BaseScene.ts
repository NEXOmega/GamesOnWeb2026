import { Engine, Scene, FreeCamera, Light, HavokPlugin } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok'
import EntityManager from '../entities/EntityManager';

export default class BaseScene {
    public canvas: HTMLCanvasElement;
    public engine: Engine;
    public scene: Scene;
    public camera: FreeCamera;
    public light: Light;

    public entityManager: EntityManager;

    constructor(canvasElement : string, pointerLock : boolean = true) {
        // Create canvas and engine.
        this.canvas = document.getElementById(canvasElement) as unknown as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);
        this.entityManager = new EntityManager();

        if(pointerLock) {
            this.canvas.onclick = () => {
                this.canvas.requestPointerLock();
            }
        }

        this.createScene().then(() => {
            this.createEnvironment();
            this.doRender();
        });
    }

    async createScene() : Promise<void> {

    }

    async createEnvironment(): Promise<void> {}

    doRender() : void {
        this.engine.runRenderLoop(() => {
            this.scene.render();
            this.entityManager.update(this.engine.getDeltaTime());
        });
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
}
