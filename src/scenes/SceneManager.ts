import { Engine, Scene } from "@babylonjs/core";
import BaseScene from "./BaseScene"; // Ajuste le chemin

export default class SceneManager {
    public static engine: Engine;
    public static currentScene: BaseScene | null = null;
    public static canvas: HTMLCanvasElement;

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

    private static setFade(opacity: number) {
        const overlay = document.getElementById("fadeOverlay");
        if (overlay) overlay.style.opacity = opacity.toString();
    }

    private static wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static async changeScene(
        targetSceneId: string, 
        sceneFactory?: () => Promise<BaseScene>, 
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
            if (!sceneFactory) {
                throw new Error(`La scène ${targetSceneId} n'est pas en cache et aucune fonction de création n'a été fournie.`);
            }
            nextScene = await sceneFactory();
            await nextScene.whenReadyAsync();
            
            this.sceneCache.set(targetSceneId, nextScene);
        } else {
            console.log(`Scène ${targetSceneId} chargée depuis la RAM !`);
        }

        this.currentScene = nextScene;
        this.currentSceneId = targetSceneId;
        
        this.currentScene.attachControl();

        this.engine.runRenderLoop(() => {
            this.currentScene?.render();
        });

        this.setFade(0);
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