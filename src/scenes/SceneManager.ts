import { Engine, Scene, Vector3 } from "@babylonjs/core";
import BaseScene from "./BaseScene";
import { GameSaveData } from "../utils/SaveManager";
import { StateManager } from "../utils/StateManager";

export type SceneFactory = () => Promise<BaseScene>;

export default class SceneManager {
    
    public static engine: Engine;
    public static currentScene: BaseScene | null = null;
    public static canvas: HTMLCanvasElement;

    private static sceneRegistry: Map<string, SceneFactory> = new Map();

    private static sceneCache: Map<string, BaseScene> = new Map();
    private static currentSceneId: string | null = null;

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

            this.engine.stopRenderLoop();

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

            this.engine.runRenderLoop(() => {
                this.currentScene?.render();
            });

            this.setFade(0);
    }

    public static loadFromSave(gameSaveData: GameSaveData) {
        if(!this.sceneRegistry.has(gameSaveData.sceneId)) {
            throw Error("Scene not in Scene Registry, can't load it.")
        }

        this.changeScene(gameSaveData.sceneId).then((scene) => {
            const playerPosition = new Vector3(gameSaveData.playerPosition.x, gameSaveData.playerPosition.y, gameSaveData.playerPosition.z);
            StateManager.actualPlayer.setPosition(playerPosition);
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
}