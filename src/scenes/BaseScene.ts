import { Engine, Scene, Light, AbstractSound, AbstractMesh, Vector3, HavokPlugin, RecastJSPlugin, KeyboardEventTypes } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import HavokPhysics from "@babylonjs/havok";

import EntityManager from '../entities/EntityManager';
import { State, StateConfig, StateManager } from '../utils/StateManager';
import CinematicCamera from '../camera/CinematicCamera';
import InputManager from '../utils/InputManager';
import DialogueManager from '../dialogs/DialogueManager';
import InteractionEntity from '../entities/InteractionEntity';
import Player from '../characters/Player';
import SoundManager from '../sounds/SoundManager';
import OptionsHUD from '../gui/OptionHUD';

export default class BaseScene extends Scene {
    public canvas: HTMLCanvasElement;
    public cinematicCamera: CinematicCamera;
    public light: Light;
    public entityManager: EntityManager;

    public actualPlayer: Player | null = null;
    public currectInteractionEntity: InteractionEntity | null = null;

    public sceneSounds : Map<string, AbstractSound> = new Map();

    public playerSpawn : Vector3 = new Vector3(0,0,0);

    public optionsHud: OptionsHUD;
    private isEscapeDown: boolean = false;

    constructor(engine: Engine, canvasElement: string, pointerLock: boolean = true) {
        super(engine);
        
        this.canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
        this.entityManager = new EntityManager();

        this.optionsHud = new OptionsHUD(this);

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
            DialogueManager.update();
            InputManager.clearJustPressed();
        });
    }

    public async initScene(): Promise<void> {
        await this.initBaseFeatures(); // Initialise la physique et les outils globaux
        await this.createScene();
        await this.createEnvironment();
        InputManager.init(this);
        DialogueManager.init(this);
    }

    /**
     * Centralise la configuration globale de la scène (Physique, Caméra, Debug)
     */
    private async initBaseFeatures(): Promise<void> {
        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);
        this.collisionsEnabled = true;
        this.enablePhysics(new Vector3(0, -100, 0), havokPlugin);

        this.cinematicCamera = new CinematicCamera(this, this.canvas);

        this.setupGlobalShortcuts();
    }

    private setupGlobalShortcuts() {
        this.onKeyboardObservable.add((kbInfo) => {
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN && kbInfo.event.key === "Escape" && !this.isEscapeDown) {
                this.isEscapeDown = true;

                if (StateManager.state === State.PLAYING || StateManager.state === State.IN_INVENTORY) {
                    this.optionsHud.toggle();
                }
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP && kbInfo.event.key === "Escape") {
                this.isEscapeDown = false;
            }
        });

        window.addEventListener("keydown", (ev) => {
            if (ev.altKey && ev.key === 'i') {
                if (this.debugLayer.isVisible()) {
                    this.debugLayer.hide();
                } else {
                    this.debugLayer.show({ embedMode: true });
                }
            }
        });

        // Basculer entre la caméra joueur et la caméra cinématique avec Alt+C
        window.addEventListener("keydown", (ev) => {
            if(ev.altKey && ev.key === 'c') {
                if(this.activeCamera === this.cinematicCamera && this.actualPlayer) {
                    this.activeCamera = this.actualPlayer.playerCamera;
                    StateManager.state = State.PLAYING;
                } else {
                    this.activeCamera = this.cinematicCamera;
                    StateManager.state = State.CINEMATIC;
                    this.cinematicCamera.moveTo(
                        this.cinematicCamera.position, 
                        this.cinematicCamera.position.add(new Vector3(0,5,0)), 
                        this.cinematicCamera.rotation, 
                        new Vector3(0,0,0), 
                        5
                    );
                }
            }
        });
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
        console.log("Playing sound " + url);
        
    }
        
    public onSleep() {
        this.stopEntityLoopingSounds();
        this.sceneSounds.forEach(s => s.pause());
    }

    public onWakeUp() {
        this.sceneSounds.forEach(s => s.play());
    }

    public dispose() {
        this.stopEntityLoopingSounds();
        if(this.optionsHud) this.optionsHud.dispose();
        this.sceneSounds.forEach(s => {
            s.stop();
            s.dispose();
        });
        this.sceneSounds = new Map()
        super.dispose();
    }

    private stopEntityLoopingSounds(): void {
        this.entityManager.getEntities().forEach(entity => {
            const entityWithLaserSound = entity as typeof entity & {
                stopLaserChargeSound?: () => void;
            };

            entityWithLaserSound.stopLaserChargeSound?.();
        });
    }
}
