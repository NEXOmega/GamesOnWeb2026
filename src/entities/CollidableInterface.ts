import { AbstractMesh } from "@babylonjs/core";

/**
 * Represents an entity that can be checked for collisions.
 */
export interface Collidable {
    /**
     * Gets the mesh used for collision detection.
     * @returns The collision mesh.
     */
    getCollisionMesh(): AbstractMesh;
}
