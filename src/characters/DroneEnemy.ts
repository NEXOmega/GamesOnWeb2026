import { AbstractMesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, SceneLoader, Vector3 } from "@babylonjs/core";
import { Enemy } from "./Enemy";
import BaseScene from "../scenes/BaseScene";
import RangedAttackBehavior from "./behaviors/RangedAttackBehavior";
import TargetingLaser from "../effects/TargetingLaser";
import FindPlayerTargetBehavior from "./behaviors/FindPlayerTargetBehavior";
import ChaseTargetBehavior from "./behaviors/ChaseTargetBehavior";
import IdleBehavior from "./behaviors/IdleBehavior";
import FlyingNavigation from "./navigation/FlyingNavigation";

/**
 * Enemie de base du jeu, fait des patrouilles selon un chemin défini, et si il détecte le joueur, il le suit pour essayer de l'éliminer.
 */
export default class DroneEnemy extends Enemy {

    public collider: AbstractMesh;
    public physicsAggregate: PhysicsAggregate;
    public laser: TargetingLaser;

    public fireCooldown: number = 3000;
    public attackRange: number = 15;
    public moveSpeed: number = 8;

    /** Dégâts infligés au joueur quand le laser le touche. */
    public laserDamage: number = 10;

    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<DroneEnemy> {
        const result = await SceneLoader.ImportMeshAsync("", "./assets/models/enemies/", "Drone.glb", scene);

        const model = result.meshes[0];
        console.log("Drone réel:", model.name, model.getAbsolutePosition());

        return new DroneEnemy(id, model, scene, position);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3) {
        super(id, mesh, scene, position);

        this.collider = MeshBuilder.CreateSphere(id + "_collider", { diameter: 1.2 }, scene);
        this.collider.position = position.clone();
        this.collider.visibility = 0;

        this.mesh.parent = this.collider;
        this.mesh.position = Vector3.Zero();

        this.physicsAggregate = new PhysicsAggregate(this.collider, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0, friction: 0 }, scene);
        this.physicsAggregate.body.setGravityFactor(0);
        this.physicsAggregate.body.setLinearDamping(2);
        this.physicsAggregate.body.setAngularDamping(100);

        this.laser = new TargetingLaser(id, scene);

        this.navigation = new FlyingNavigation(this);

        this.brain.addBehavior(new FindPlayerTargetBehavior(this, 1, 25));
        this.brain.addBehavior(new RangedAttackBehavior(this, 2));
        this.brain.addBehavior(new ChaseTargetBehavior(this, 3, 25));
        this.brain.addBehavior(new IdleBehavior(this, 4));
    }

    public dispose(): void {
        this.laser.dispose();
        if (this.collider) this.collider.dispose();
        super.dispose();
    }
}