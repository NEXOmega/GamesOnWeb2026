import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, SceneLoader, Vector3 } from "@babylonjs/core";
import { Enemy } from "./Enemy";
import BaseScene from "../scenes/BaseScene";
import IANavigation from "./IANavigation"; // On importe la navigation au sol
import TargetingLaser from "../effects/TargetingLaser";

export default class GroundEnemy extends Enemy {

    public collider: AbstractMesh;
    public physicsAggregate: PhysicsAggregate;
    public laser: TargetingLaser;
    public nav: IANavigation;

    public fireCooldown: number = 3000; // Un peu plus lent qu'un drone
    public attackRange: number = 10;
    public moveSpeed: number = 4;

    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<GroundEnemy> {
        const result = await SceneLoader.ImportMeshAsync("", "./assets/models/", "Robot.glb", scene);
        const model = result.meshes[0];

        return new GroundEnemy(id, model, scene, position);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3) {
        super(id, mesh, scene, position);

        this.collider = MeshBuilder.CreateCylinder(id + "_collider", { height: 1.8, diameter: 0.8 }, scene);
        this.collider.position = position;
        this.collider.visibility = 0;

        this.mesh.parent = this.collider;
        this.mesh.position = new Vector3(0, -0.9, 0); // Ajuster pour que les pieds touchent le bas du collider

        this.physicsAggregate = new PhysicsAggregate(
            this.collider,
            PhysicsShapeType.CYLINDER,
            { mass: 1, restitution: 0, friction: 0.5 },
            scene
        );

        this.physicsAggregate.body.setGravityFactor(1);
        this.physicsAggregate.body.setLinearDamping(0.5);
        this.physicsAggregate.body.setAngularDamping(100);

        this.laser = new TargetingLaser(id, scene);

        this.nav = new IANavigation(id, this.collider, scene, position);
        this.nav.entity = this as any; // Cast nécessaire si DroneEnemy est attendu

        this.initSystems();
    }

    private async initSystems() {
        await this.nav.CreateNavMesh(false);
        if (this.scene.actualPlayer) {
            this.nav.IaToPlayer(this.scene.actualPlayer);
        }
    }

    public update(deltaMs: number): void {
        this.nav.update(deltaMs);
    }

    public dispose(): void {
        this.laser.dispose();
        if (this.collider) this.collider.dispose();
        super.dispose();
    }
}