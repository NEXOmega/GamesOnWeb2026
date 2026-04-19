import { Engine, Scene, Light, AbstractSound, AbstractMesh } from '@babylonjs/core';
import EntityManager from '../entities/EntityManager';
import { State, StateConfig, StateManager } from '../utils/StateManager';
import CinematicCamera from '../camera/CinematicCamera';
import InputManager from '../utils/InputManager';
import DialogueManager from '../dialogs/DialogueManager';
import InteractionEntity from '../entities/InteractionEntity';
import Player from '../characters/Player';
import SoundManager from '../sounds/SoundManager';

export default class BaseScene extends Scene {
    public canvas: HTMLCanvasElement;
    public cinematicCamera: CinematicCamera;
    public light: Light;
    public entityManager: EntityManager;

    public actualPlayer: Player | null = null;
    public currectInteractionEntity: InteractionEntity | null = null;

    public sceneSounds : Map<string, AbstractSound> = new Map();

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

    public async attachSpatialSound(mesh: AbstractMesh, id: string, url: string, maxDistance: number, loop : boolean = false) {
        const sound = await SoundManager.createSpatialSound(id, url, maxDistance, loop);
        sound.spatial.attach(mesh)
        sound.play()
        this.sceneSounds.set(id, sound);
    }

    public async playSceneMusic(url: string, loop : boolean = false) {
        if(this.sceneSounds.has("scene_ambient")) {
            this.sceneSounds.get("scene_ambient").dispose()
        }
        const sound = await SoundManager.createSound("scene_ambient", url, loop)
        sound.play()
        this.sceneSounds.set("scene_ambient", sound)
    }
        
    public onSleep() {
        this.sceneSounds.forEach(s => s.pause());
    }

    public onWakeUp() {
        this.sceneSounds.forEach(s => s.play());
    }

    public dispose() {
        this.sceneSounds.forEach(s => {
            s.stop();
            s.dispose();
        });
        this.sceneSounds = new Map()
        super.dispose();
    }
}