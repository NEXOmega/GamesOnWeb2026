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

    constructor(canvasElement : string, pointerLock : boolean = true) {
        super(new Engine(document.getElementById(canvasElement) as unknown as HTMLCanvasElement))
        // Create canvas and engine.
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
            DialogueManager.init(this);
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
}
