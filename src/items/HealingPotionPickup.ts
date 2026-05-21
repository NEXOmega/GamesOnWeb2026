// HealingPotionPickup.ts
import Entity from "../entities/Entity";
import { MeshBuilder, Vector3 } from "@babylonjs/core"; // ← Scene retiré
import Player from "../characters/Player";
import BaseScene from "../scenes/BaseScene";

export class HealingPotionPickup extends Entity {
    constructor(scene: BaseScene, position: Vector3) {
        const mesh = MeshBuilder.CreateSphere("health_potion", { diameter: 0.3 }, scene);
        mesh.position = position;
        super("healingPotionPickup", mesh, scene);
    }

    onInteract(player: Player): void {
        const added = player.getInventory().addItem("healing_potion", 1);
        if (added) {
            this.mesh.dispose();
            console.log("[Pickup] Potion de soin ramassée");
        }
    }
}