import { AbstractMesh, Color3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, SceneLoader, StandardMaterial, Vector3 } from "@babylonjs/core";
import { Enemy } from "./Enemy";
import BaseScene from "../scenes/BaseScene";
import RangedAttackBehavior from "./behaviors/RangedAttackBehavior";
import TargetingLaser from "../effects/TargetingLaser";
import FindPlayerTargetBehavior from "./behaviors/FindPlayerTargetBehavior";
import ChaseTargetBehavior from "./behaviors/ChaseTargetBehavior";
import IdleBehavior from "./behaviors/IdleBehavior";
import StealthDetectionBehavior from "./behaviors/StealthDetectionBehavior";

/**
 * Enemie de base du jeu, fait des patrouilles selon un chemin défini, et si il détecte le joueur, il le suit pour essayer de l'éliminer.
 *
 */
export default class DroneEnemyCone extends Enemy {
    
    public collider: AbstractMesh;
    public physicsAggregate: PhysicsAggregate;
    public laser: TargetingLaser;
    
    public fireCooldown: number = 2000;
    public attackRange: number = 15;
    public moveSpeed: number = 8;


    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<DroneEnemyCone> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "Drone.glb", scene);
        const model = result.meshes[0];
        
        return new DroneEnemyCone(id, model, scene, position);
    }

    private stealthBehavior: StealthDetectionBehavior;

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3) {
        super(id, mesh, scene, position);
        
        this.attackRange = 15;
        this.moveSpeed = 8;
        this.fireCooldown = 2000;
        
        this.collider = MeshBuilder.CreateSphere(id + "_collider", { diameter: 1.2 }, scene);
        this.collider.position = position;
        this.collider.visibility = 0;
        
        this.mesh.parent = this.collider;
        this.mesh.position = Vector3.Zero();

        this.physicsAggregate = new PhysicsAggregate(this.collider, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0, friction: 0 }, scene);
        this.physicsAggregate.body.setGravityFactor(0);
        this.physicsAggregate.body.setLinearDamping(2);
        this.physicsAggregate.body.setAngularDamping(100); 

        this.laser = new TargetingLaser(id, scene);

        this.stealthBehavior = new StealthDetectionBehavior(this, 1, 10, Math.PI / 2);
        
        this.brain.addBehavior(this.stealthBehavior); 
        this.brain.addBehavior(new RangedAttackBehavior(this, 2)); 
        this.brain.addBehavior(new ChaseTargetBehavior(this, 3, 15));
        this.brain.addBehavior(new IdleBehavior(this, 4));
    }

    public dispose(): void {
        this.laser.dispose();
        this.stealthBehavior.dispose();
        if (this.collider) this.collider.dispose();
        super.dispose();
    }
}