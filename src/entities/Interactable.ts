import { AbstractMesh, SceneLoader, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";
import { ClearDialog, ConsoleLogAction } from "../actions/Action";
import { ActionSerializer } from "../utils/json/ActionSerializer";
import BaseScene from "../scenes/BaseScene";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import * as TitleAnimation from '../gui/title/TitleAnimation';

export default class Interactable extends Entity {

    public readonly model: AbstractMesh;
    readonly interaction: InteractionEntity;

    /**
     * @param modelPath  Chemin optionnel vers un GLB externe (ex: "npc/solar_panel.glb").
     *                   Si fourni, le cube placeholder du level est caché et remplacé par ce modèle.
     *                   Si absent, le mesh du level est utilisé tel quel.
     */
    static async CreateAsync(id: string, scene: BaseScene, mesh: AbstractMesh, actionsString: string, modelPath?: string): Promise<Interactable> {

        const spawnPos = mesh.getAbsolutePosition().clone();
        const spawnRot = mesh.rotation.clone();

        if (modelPath) {
            // Cache le placeholder Blender (cube, etc.)
            mesh.setEnabled(false);

            // Charge le vrai modèle
            const folder = "./assets/models/" + modelPath.substring(0, modelPath.lastIndexOf('/') + 1);
            const file   = modelPath.substring(modelPath.lastIndexOf('/') + 1);
            const result = await SceneLoader.ImportMeshAsync("", folder, file, scene);
            const loadedMesh = result.meshes[0];
            loadedMesh.position = spawnPos;
            loadedMesh.rotation = spawnRot;
            return new Interactable(id, loadedMesh, scene, spawnPos, actionsString, spawnRot);
        }

        mesh.setParent(null);
        return new Interactable(id, mesh, scene, mesh.position, actionsString, mesh.rotation);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero(), actionsString: string, rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, position, rotation);
                
        this.model = mesh;
        
        this.interaction = new InteractionEntity(id+"_interaction", this.scene.actualPlayer, 5, scene);
        
        this.model.computeWorldMatrix(true);
        this.model.refreshBoundingInfo(true, true);
        
        const centerLocal = this.model.getBoundingInfo().boundingBox.center;
        this.interaction.mesh.position = centerLocal;
        
        this.interaction.addInteractAction(new ConsoleLogAction("Test"));
        
        const actions = ActionSerializer.deserializeArray(actionsString);
        for(const action of actions) {
            this.interaction.addInteractAction(action);
        }

        this.addChild(this.interaction);
        this.scene.entityManager.addEntity(this);
    }
}