import { Engine, Scene, Light } from '@babylonjs/core';
import EntityManager from '../entities/EntityManager';
import { State, StateManager } from '../utils/StateManager';
import CinematicCamera from '../camera/CinematicCamera';
import InputManager from '../utils/InputManager';
import DialogueManager from '../dialogs/DialogueManager';

export default class BaseScene extends Scene {
    public canvas: HTMLCanvasElement;
    public cinematicCamera: CinematicCamera;
    public light: Light;
    public entityManager: EntityManager;

    constructor(engine: Engine, canvasElement: string, pointerLock: boolean = true) {
        super(engine);
        
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.entityManager = new EntityManager();

        if(pointerLock) {
            this.canvas.onclick = () => {
                if(StateManager.state != State.IN_INVENTORY)
                    this.canvas.requestPointerLock();
            }
        }

        this.onBeforeRenderObservable.add(() => {
            const deltaTime = this.getEngine().getDeltaTime();
            this.entityManager.update(deltaTime);
            
            if(StateManager.actualPlayer != null) {
                StateManager.actualPlayer.playerHud.update(deltaTime);
            }
        });
    }

    public async initScene(): Promise<void> {
        await this.createScene();
        await this.createEnvironment();
        InputManager.init(this);
        DialogueManager.init(this);
    }

    async createScene(): Promise<void> {}
    async createEnvironment(): Promise<void> {}
}