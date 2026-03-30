import { AbstractMesh, ActionManager, ExecuteCodeAction, MeshBuilder, Scene, Vector3 } from "@babylonjs/core";
import Entity from "./Entity";
import { Collidable } from "./CollidableInterface";
import { StateManager } from "../utils/StateManager";
import Player from "../characters/Player";
import Action from "../actions/Action";

/**
 * Used for interactions, will call onMeshEntered or onMeshExited when the target enter inside de sphere
 * 
 * @todo Improve and implements the possibility of having different mesh type instead of just a sphere
 */
export default class CollisionEntity extends Entity implements Collidable {
    //TODO Utiliser des Action plutot que des lambdas
    public meshEnteredAction: Action;
    public meshExitedAction: Action;
    public meshIsInside: boolean = false;

    public distance: number = 0;
    public readonly target: Collidable;

    /**
     * Default constructor
     * @param target Target mesh that will trigger actions when entering or leaving the mesh
     * @param distance Radius of the sphere
     * @param scene Scene so we can create the the entity and action manager
     */
    constructor(target: Collidable, distance: number, scene: Scene, position: Vector3 = Vector3.Zero()) {
        super(MeshBuilder.CreateSphere("debugEntity", { diameter: distance }, scene), scene);
        this.distance = distance;
            this.target = target;

            this.mesh.position = position // Example position
            this.mesh.isPickable = false;
            this.mesh.visibility = 0.5;
            this.mesh.actionManager = new ActionManager(scene);
                this.mesh.actionManager.registerAction(new ExecuteCodeAction({
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: target.getCollisionMesh() // Detect intersection with the collidable's mesh
                }, () => {
                    this.onMeshEntered();
                }));
            this.mesh.actionManager.registerAction(new ExecuteCodeAction({
                trigger: ActionManager.OnIntersectionExitTrigger,
                parameter: target.getCollisionMesh()
            }, () => {
                this.onMeshExited();
            }))
            console.log(this.mesh.metadata)
    }
    getCollisionMesh(): AbstractMesh {
        return this.mesh;
    }

    public update(delta: number): void {
        super.update(delta);
    }

    /**
     * Triggered when target mesh enter our own mesh
     * @param actionEvent the ActionEvent may be used for some info
     */
    public onMeshEntered() {
        this.meshIsInside = true;
        if (this.meshEnteredAction) {
            if(this.target.getCollisionMesh().metadata.entity instanceof Player)
                this.meshEnteredAction.execute(this.target.getCollisionMesh().metadata.entity);
        }
    }

    /**
     * Triggered when target mesh leave our own mesh
     * @param actionEvent the ActionEvent may be used for some info
     */
    public onMeshExited() {
        this.meshIsInside = false;
        if (this.meshExitedAction) {
            if(this.target.getCollisionMesh().metadata.entity instanceof Player)
                this.meshExitedAction.execute(this.target.getCollisionMesh().metadata.entity);
        }
    }
}