import { Observer,Scene } from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, Rectangle, ScrollViewer,StackPanel, TextBlock } from "@babylonjs/gui";

import SceneManager from "../scenes/SceneManager";

export default class DebugHUD {
    private texture: AdvancedDynamicTexture;
    private mainContainer: Rectangle;
    private listPanel: StackPanel;
    private isVisible: boolean = false;
    
    private fpsText: TextBlock;
    private renderObserver: Observer<Scene>;
    private scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        this.texture = AdvancedDynamicTexture.CreateFullscreenUI("DebugHUD", true, scene);

        this.mainContainer = new Rectangle("DebugContainer");
        this.mainContainer.width = "300px";
        this.mainContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.mainContainer.background = "rgba(0, 0, 0, 0.8)";
        this.mainContainer.color = "white";
        this.mainContainer.thickness = 2;
        this.mainContainer.isVisible = this.isVisible;
        this.texture.addControl(this.mainContainer);

        const scrollViewer = new ScrollViewer();
        scrollViewer.thickness = 0;
        this.mainContainer.addControl(scrollViewer);

        this.listPanel = new StackPanel();
        this.listPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.listPanel.paddingTop = "10px";
        this.listPanel.spacing = 10;
        scrollViewer.addControl(this.listPanel);

        const title = new TextBlock("title", "🛠️ SCENE DEBUG");
        title.height = "40px";
        title.color = "cyan";
        title.fontSize = 24;
        this.listPanel.addControl(title);
        
        this.fpsText = new TextBlock("fpsText", "FPS: 60");
        this.fpsText.height = "30px";
        this.fpsText.color = "lime"; 
        this.fpsText.fontSize = 20;
        this.fpsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        this.fpsText.paddingBottom = "70px";
        this.mainContainer.addControl(this.fpsText);

        const verticesText = new TextBlock("vertText", "Vertices: 0");
        verticesText.height = "30px";
        verticesText.color = "white"; 
        verticesText.fontSize = 18;
        verticesText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        verticesText.paddingBottom = "40px";
        this.mainContainer.addControl(verticesText);

        const drawCallsText = new TextBlock("drawText", "Draw Calls: 0");
        drawCallsText.height = "30px";
        drawCallsText.color = "white"; 
        drawCallsText.fontSize = 18;
        drawCallsText.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
        drawCallsText.paddingBottom = "10px";
        this.mainContainer.addControl(drawCallsText);

        this.renderObserver = this.scene.onAfterRenderObservable.add(() => {
            if (this.isVisible) {
                const engine = this.scene.getEngine();
                const fps = engine.getFps().toFixed(0);
                this.fpsText.text = `FPS: ${fps}`;
                
                if (Number(fps) >= 50) this.fpsText.color = "lime";
                else if (Number(fps) >= 30) this.fpsText.color = "orange";
                else this.fpsText.color = "red";

                const activeVertices = this.scene.getTotalVertices() / 1000;
                verticesText.text = `Vertices : ${activeVertices.toFixed(1)}k`;
                verticesText.color = activeVertices > 300 ? "red" : "white";

                const activeMeshes = this.scene.getActiveMeshes().length;
                drawCallsText.text = `Meshes Actifs : ${activeMeshes}`;

                drawCallsText.color = activeMeshes > 150 ? "red" : "white";
            }
        });

        this.updateList();
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.mainContainer.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updateList();
        }
    }

    public updateList() {
        while (this.listPanel.children.length > 1) {
            this.listPanel.children[1].dispose();
        }

        const allScenes = SceneManager.getRegisteredScenes();
        const cachedScenes = SceneManager.getCachedScenes();
        const currentScene = SceneManager.getCurrentSceneId();

        allScenes.forEach(sceneId => {
            const isCurrent = (sceneId === currentScene);
            const isCached = cachedScenes.includes(sceneId);

            let bgColor = "#444444";
            let statusText = " (Dispo)";

            if (isCurrent) {
                bgColor = "#2ecc71"; 
                statusText = " (Actuelle)";
            } else if (isCached) {
                bgColor = "#f39c12"; 
                statusText = " (En RAM)";
            }

            const btn = Button.CreateSimpleButton(`btn_${sceneId}`, sceneId + statusText);
            btn.width = "260px";
            btn.height = "50px";
            btn.color = "white";
            btn.background = bgColor;
            btn.thickness = isCurrent ? 2 : 0; 

            if (!isCurrent) {
                btn.onPointerUpObservable.add(() => {
                    console.log(`[Debug] Basculement forcé vers : ${sceneId}`);
                    SceneManager.changeScene(sceneId, true); 
                });
            }

            this.listPanel.addControl(btn);
        });

        const clearBtn = Button.CreateSimpleButton("btnClear", "🗑️ Vider le Cache RAM");
        clearBtn.width = "260px";
        clearBtn.height = "40px";
        clearBtn.color = "white";
        clearBtn.background = "#e74c3c"; // Rouge
        clearBtn.paddingTop = "20px";
        clearBtn.onPointerUpObservable.add(() => {
            SceneManager.clearCache();
            this.updateList(); 
        });
        this.listPanel.addControl(clearBtn);
    }

    public dispose() {
        this.scene.onBeforeRenderObservable.remove(this.renderObserver);
        this.texture.dispose();
    }
}