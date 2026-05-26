

import { AbstractMesh, SceneLoader, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import InteractionEntity from "./InteractionEntity";
import SendFrontTitleRequest from "../actions/SendFrontTitleRequest";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import ItemRegistry from "../items/ItemRegistry";
import BaseScene from "../scenes/BaseScene";
import {AddItemToInventory, ClearDialog, OnceAction, RemoveEntityFromScene} from "../actions/Action";


export default class Pickable extends Entity {


        public readonly collistionMesh: AbstractMesh;
        public readonly model: AbstractMesh;
        readonly interaction: InteractionEntity;
        private _pickedUp = false

    static async CreateAsync(id: string, scene: BaseScene, position: Vector3, itemId: string, quantity: number): Promise<Pickable> {
        const result = await SceneLoader.ImportMeshAsync("", "./assets/models/items/", itemId + ".glb", scene);
        const root = result.meshes[0];
        const visualMesh = result.meshes[1];
        if (visualMesh) visualMesh.scaling = new Vector3(0.05, 0.05, 0.05);
        return new Pickable(id, root, scene, position, itemId, quantity);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3 = Vector3.Zero(), itemId: string, quantity: number, rotation: Vector3 = Vector3.Zero()) {
        super(id, mesh, scene, position, rotation);

        if(!ItemRegistry.getItem(itemId))
            throw new Error(`Erreur le type ${itemId}, nest pas enregistré dans l'ItemRegistry`)

        this.model = mesh;

        this.interaction = new InteractionEntity(id+"_interaction", this.scene.actualPlayer, 5, scene);
        this.interaction.mesh.position = Vector3.Zero();

        this.interaction.addMeshEnteredAction(new SendFrontTitleRequest({
            text: "Pickup " + ItemRegistry.getItem(itemId).name,
            animation: new TitleAnimation.FadeAnimation(1,0,1)
        }));
        this.interaction.addMeshExitedAction(new ClearDialog());

        this.interaction.addInteractAction(new OnceAction(
            new AddItemToInventory(itemId, quantity),
            new RemoveEntityFromScene(this.id),
            new ClearDialog()
        ));

        this.addChild(this.interaction);
        this.scene.entityManager.addEntity(this);
    }

}