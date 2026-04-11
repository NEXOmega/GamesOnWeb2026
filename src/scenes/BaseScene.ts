import { Engine, Scene, Light } from '@babylonjs/core';
import EntityManager from '../entities/EntityManager';
import { State, StateConfig, StateManager } from '../utils/StateManager';
import CinematicCamera from '../camera/CinematicCamera';
import InputManager from '../utils/InputManager';
import DialogueManager from '../dialogs/DialogueManager';
import InteractionEntity from '../entities/InteractionEntity';
import Player from '../characters/Player';

export default class BaseScene extends Scene {
    public canvas: HTMLCanvasElement;
    public cinematicCamera: CinematicCamera;
    public light: Light;
    public entityManager: EntityManager;


    public actualPlayer: Player | null = null;
    public currectInteractionEntity: InteractionEntity | null = null;

    constructor(engine: Engine, canvasElement: string, pointerLock: boolean = true) {
        super(engine);
        
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.entityManager = new EntityManager();

        if(pointerLock) {
            this.canvas.onclick = () => {
                if(StateConfig[StateManager.state].pointerLock)
                    this.canvas.requestPointerLock();
            }
        }

        this.onBeforeRenderObservable.add(() => {
            const deltaTime = this.getEngine().getDeltaTime();
            this.entityManager.update(deltaTime);
            
            if(this.actualPlayer != null) {
                this.actualPlayer.playerHud.update(deltaTime);
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