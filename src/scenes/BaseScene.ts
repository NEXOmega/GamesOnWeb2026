import { Engine, Scene, FreeCamera, Light, HavokPlugin } from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok'
import EntityManager from '../entities/EntityManager';
import { StateManager } from '../utils/StateManager';
import CinematicCamera from '../camera/CinematicCamera';
import InputManager from '../utils/InputManager';
import DialogueManager from '../dialogs/DialogueManager';

export default class BaseScene extends Scene {
    public canvas: HTMLCanvasElement;
    public cinematicCamera: CinematicCamera;
    public light: Light;
    public entityManager: EntityManager;

    public onSwitchScene?: (sceneName: string) => void;
    constructor(canvasElement : string, engine?: Engine,  pointerLock : boolean = true) {

        // Create canvas and engine.
        const canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        super(engine ?? new Engine(canvas));
        this.canvas = document.getElementById(canvasElement) as unknown as HTMLCanvasElement;
        this.entityManager = new EntityManager();

        if(pointerLock) {
            this.canvas.onclick = () => {
                this.canvas.requestPointerLock();
            }
        }

        this.createScene().then(() => {
            this.createEnvironment();
            this.doRender();
            InputManager.init(this);
            DialogueManager.init();
        });
    }

    async createScene() : Promise<void> {

    }

    async createEnvironment(): Promise<void> {}

    doRender() : void {
        this.getEngine().runRenderLoop(() => {
            this.render();
            this.entityManager.update(this.getEngine().getDeltaTime());
            if(StateManager.actualPlayer != null) {
                StateManager.actualPlayer.playerHud.update(this.getEngine().getDeltaTime());
            }
        });
        window.addEventListener('resize', () => {
            this.getEngine().resize();
        });
    }

        disposeScene(): void {
        this.getEngine().stopRenderLoop();
        this.entityManager.clear();       // à implémenter si pas déjà fait
        StateManager.actualPlayer = null;
        this.dispose();                    // Scene.dispose() de Babylon
    }

}
