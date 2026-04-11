import { Engine, Scene, Vector3 } from "@babylonjs/core";
import BaseScene from "./BaseScene";
import { GameSaveData } from "../utils/SaveManager";
import { StateManager } from "../utils/StateManager";
import DebugHUD from "../gui/DebugHUD";

export type SceneFactory = () => Promise<BaseScene>;

export default class SceneManager {
    
    public static engine: Engine;
    public static currentScene: BaseScene | null = null;
    public static canvas: HTMLCanvasElement;

    private static sceneRegistry: Map<string, SceneFactory> = new Map();

    private static sceneCache: Map<string, BaseScene> = new Map();
    private static currentSceneId: string | null = null;

    private static debugHUD: DebugHUD | null = null;
    private static showDebugOnLoad: boolean = false;

    public static init(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.engine = new Engine(this.canvas, true);

        this.engine.runRenderLoop(() => {
            if (this.currentScene) {
                this.currentScene.render();
            }
        });

        window.addEventListener('resize', () => {
            this.engine.resize();
        });

        window.addEventListener("keydown", (ev) => {
            if (ev.key === "F3") {
                if (this.debugHUD) {
                    this.debugHUD.toggle();
                    // On mémorise l'état pour le garder ouvert après un chargement
                    this.showDebugOnLoad = !this.showDebugOnLoad; 
                }
            }
        });
    }

    public static registerScene(sceneId: string, factory: SceneFactory) {
        if (this.sceneRegistry.has(sceneId)) {
            console.warn(`La scène ${sceneId} est déjà enregistrée. Elle va être remplacée.`);
        }
        this.sceneRegistry.set(sceneId, factory);
        console.log(`Scène ${sceneId} ajoutée au registre !`);
    }

    private static setFade(opacity: number) {
        const overlay = document.getElementById("fadeOverlay");
        if (overlay) overlay.style.opacity = opacity.toString();
    }

    private static wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static async changeScene(
            targetSceneId: string, 
            keepCurrentInRAM: boolean = false
        ) {
            this.setFade(1);
            await this.wait(500);

            if (this.currentScene && this.currentSceneId) {
                this.currentScene.detachControl();

                if (!keepCurrentInRAM) {
                    this.currentScene.dispose();
                    this.sceneCache.delete(this.currentSceneId);
                } else {
                    this.sceneCache.set(this.currentSceneId, this.currentScene);
                }
            }

            let nextScene = this.sceneCache.get(targetSceneId);

            if (!nextScene) {
                const factory = this.sceneRegistry.get(targetSceneId);

                if (!factory) {
                    throw new Error(`Impossible de charger "${targetSceneId}". La scène n'est ni en cache, ni dans le registre.`);
                }

                nextScene = await factory();
                await nextScene.whenReadyAsync();
                
                this.sceneCache.set(targetSceneId, nextScene);
            } else {
                console.log(`Scène ${targetSceneId} chargée instantanément depuis la RAM !`);
            }

            this.currentScene = nextScene;
            this.currentSceneId = targetSceneId;
            
            this.currentScene.attachControl(true);

            this.debugHUD = new DebugHUD(this.currentScene);
            if (this.showDebugOnLoad) {
                this.debugHUD.toggle();
            }

            this.setFade(0);
    }

    public static loadFromSave(gameSaveData: GameSaveData) {
        if(!this.sceneRegistry.has(gameSaveData.sceneId)) {
            throw Error("Scene not in Scene Registry, can't load it.")
        }

        this.changeScene(gameSaveData.sceneId).then((scene) => {
            const playerPosition = new Vector3(gameSaveData.playerPosition.x, gameSaveData.playerPosition.y, gameSaveData.playerPosition.z);
            this.currentScene.actualPlayer.setPosition(playerPosition);
        });
    }

    public static clearCache() {
        this.sceneCache.forEach((scene, id) => {
            if (id !== this.currentSceneId) {
                scene.dispose();
            }
        });
        this.sceneCache.clear();
        
        if (this.currentSceneId && this.currentScene) {
            this.sceneCache.set(this.currentSceneId, this.currentScene);
        }
        console.log("RAM libérée !");
    }

    public static getRegisteredScenes(): string[] {
        return Array.from(this.sceneRegistry.keys());
    }

    public static getCachedScenes(): string[] {
        return Array.from(this.sceneCache.keys());
    }

    public static getCurrentSceneId(): string | null {
        return this.currentSceneId;
    }

}