import { AdvancedDynamicTexture, Rectangle, StackPanel, TextBlock, Button, Control, ScrollViewer } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import SceneManager from "../scenes/SceneManager";

export default class DebugHUD {
    private texture: AdvancedDynamicTexture;
    private mainContainer: Rectangle;
    private listPanel: StackPanel;
    private isVisible: boolean = false;

    constructor(scene: Scene) {
        // On crée l'UI attachée à la scène courante
        this.texture = AdvancedDynamicTexture.CreateFullscreenUI("DebugHUD", true, scene);

        // Le conteneur principal (à droite de l'écran)
        this.mainContainer = new Rectangle("DebugContainer");
        this.mainContainer.width = "300px";
        this.mainContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.mainContainer.background = "rgba(0, 0, 0, 0.8)";
        this.mainContainer.color = "white";
        this.mainContainer.thickness = 2;
        this.mainContainer.isVisible = this.isVisible;
        this.texture.addControl(this.mainContainer);

        // Un ScrollViewer au cas où tu aurais beaucoup de scènes
        const scrollViewer = new ScrollViewer();
        scrollViewer.thickness = 0;
        this.mainContainer.addControl(scrollViewer);

        this.listPanel = new StackPanel();
        this.listPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.listPanel.paddingTop = "10px";
        this.listPanel.spacing = 10;
        scrollViewer.addControl(this.listPanel);

        // Titre
        const title = new TextBlock("title", "🛠️ SCENE DEBUG");
        title.height = "40px";
        title.color = "cyan";
        title.fontSize = 24;
        this.listPanel.addControl(title);

        this.updateList();
    }

    public toggle() {
        this.isVisible = !this.isVisible;
        this.mainContainer.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updateList(); // On rafraîchit les données à chaque ouverture
        }
    }

    public updateList() {
        // 1. On nettoie les anciens boutons (sauf le titre qui est le premier enfant)
        while (this.listPanel.children.length > 1) {
            this.listPanel.children[1].dispose();
        }

        // 2. On récupère les états depuis le SceneManager
        const allScenes = SceneManager.getRegisteredScenes();
        const cachedScenes = SceneManager.getCachedScenes();
        const currentScene = SceneManager.getCurrentSceneId();

        // 3. On génère les boutons dynamiquement
        allScenes.forEach(sceneId => {
            const isCurrent = (sceneId === currentScene);
            const isCached = cachedScenes.includes(sceneId);

            let bgColor = "#444444"; // Gris par défaut (Non chargée)
            let statusText = " (Dispo)";

            if (isCurrent) {
                bgColor = "#2ecc71"; // Vert (Actuelle)
                statusText = " (Actuelle)";
            } else if (isCached) {
                bgColor = "#f39c12"; // Orange (En RAM)
                statusText = " (En RAM)";
            }

            const btn = Button.CreateSimpleButton(`btn_${sceneId}`, sceneId + statusText);
            btn.width = "260px";
            btn.height = "50px";
            btn.color = "white";
            btn.background = bgColor;
            btn.thickness = isCurrent ? 2 : 0; // Bordure plus épaisse pour la scène actuelle

            // Action du bouton
            if (!isCurrent) {
                btn.onPointerUpObservable.add(() => {
                    console.log(`[Debug] Basculement forcé vers : ${sceneId}`);
                    // On garde la scène actuelle en RAM par défaut via le debug
                    SceneManager.changeScene(sceneId, true); 
                });
            }

            this.listPanel.addControl(btn);
        });

        // 4. Ajout d'un bouton pour vider la RAM manuellement
        const clearBtn = Button.CreateSimpleButton("btnClear", "🗑️ Vider le Cache RAM");
        clearBtn.width = "260px";
        clearBtn.height = "40px";
        clearBtn.color = "white";
        clearBtn.background = "#e74c3c"; // Rouge
        clearBtn.paddingTop = "20px";
        clearBtn.onPointerUpObservable.add(() => {
            SceneManager.clearCache();
            this.updateList(); // On met à jour l'UI visuellement
        });
        this.listPanel.addControl(clearBtn);
    }
}