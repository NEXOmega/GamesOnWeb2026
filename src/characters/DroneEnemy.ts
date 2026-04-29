import { AbstractMesh, Color3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Ray, SceneLoader, StandardMaterial, Vector3 } from "@babylonjs/core";
import { Enemy, EnemyState } from "./Enemy";
import BaseScene from "../scenes/BaseScene";
import TargetingLaser from "../effects/TargetingLaser";

export default class DroneEnemy extends Enemy {
    
    private moveSpeed: number = 8;
    private fireCooldown: number = 2000;
    private lastFireTime: number = 0;

    private laser: TargetingLaser;
    private isAiming: boolean = false;
    
    public collider: AbstractMesh;
    private physicsAggregate: PhysicsAggregate;

    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<DroneEnemy> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "Drone.glb", scene);
        const model = result.meshes[0];
        
        return new DroneEnemy(id, model, scene, position);
    }

    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position: Vector3) {
        super(id, mesh, scene, position);
        
        this.detectionRange = 25;
        this.attackRange = 5;
        
        this.collider = MeshBuilder.CreateSphere(id + "_collider", { diameter: 1.2 }, scene);
        this.collider.position = position;
        this.collider.visibility = 0.1;
        
        this.mesh.parent = this.collider;
        this.mesh.position = Vector3.Zero();

        this.physicsAggregate = new PhysicsAggregate(this.collider, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0, friction: 0 }, scene);
        this.physicsAggregate.body.setGravityFactor(0);
        this.physicsAggregate.body.setLinearDamping(2);
        this.physicsAggregate.body.setAngularDamping(100); 

        this.laser = new TargetingLaser(id, scene);

        this.scene.attachSpatialSound(this.mesh, `drone_engine_${id}`, "./assets/sounds/drone_buzz.mp3", 30, true);
    }

    protected idleBehavior(delta: number): void {
        this.physicsAggregate.body.setLinearVelocity(Vector3.Zero());
        this.stopAiming();
    }

    protected chaseBehavior(delta: number): void {
        if (!this.player) return;

        const deltaSeconds = delta / 1000;
        
        const myPos = this.collider.getAbsolutePosition();
        const playerPos = this.player.impostorMesh.getAbsolutePosition();
        
        const camForward = this.player.playerCamera.getForwardRay().direction;
        const playerForward = new Vector3(camForward.x, 0, camForward.z).normalize();

        const idealPos = playerPos.add(playerForward.scale(this.attackRange * 0.8));
        idealPos.y = playerPos.y + 2;

        let desiredDirection = idealPos.subtract(myPos).normalize();

        const ray = new Ray(myPos, desiredDirection, 4);
        
        const hit = this.scene.pickWithRay(ray, (m) => 
            m !== this.collider && 
            m !== this.mesh && 
            !m.isDescendantOf(this.mesh) && 
            m.name !== "skyBox" &&
            m.name !== "CharacterTransform" &&
            m.isPickable
        );

        if (hit && hit.hit) {
            const hitNormal = hit.getNormal(true)!;
            desiredDirection = desiredDirection.add(hitNormal.scale(2)).normalize();
        }

        if (!this.mesh.rotationQuaternion) this.mesh.rotationQuaternion = Quaternion.Identity();
        
        const directionToPlayer = playerPos.add(new Vector3(0,1,0)).subtract(myPos).normalize();
        const targetRotation = Quaternion.FromLookDirectionLH(directionToPlayer, Vector3.Up());
        this.mesh.rotationQuaternion = Quaternion.Slerp(this.mesh.rotationQuaternion, targetRotation, 5 * deltaSeconds);

        const velocity = desiredDirection.scale(this.moveSpeed);
        this.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, velocity.y, velocity.z)); 
        this.stopAiming();
    }

    private stopAiming() {
        if (this.isAiming) {
            this.laser.stopAim();
            this.isAiming = false;
        }
    }

protected attackBehavior(delta: number): void {
        if (!this.player) return;
        
        const currentVel = this.physicsAggregate.body.getLinearVelocity();
        this.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));

        const myPos = this.collider.getAbsolutePosition();
        const targetPos = this.player.impostorMesh.getAbsolutePosition(); 
        const desiredDirection = targetPos.subtract(myPos).normalize();

        const currentTime = performance.now();
        
        if (!this.isAiming) {
            this.isAiming = true;
            this.lastFireTime = currentTime;
        }

        const timeAiming = currentTime - this.lastFireTime;
        const progress = Math.min(timeAiming / this.fireCooldown, 1);

        this.laser.aim(myPos, targetPos, progress);

        if (timeAiming > this.fireCooldown) {
            this.fireAtPlayer(myPos, desiredDirection);
            
            this.isAiming = false; 
            
            this.lastFireTime = currentTime;
        }
    }

    private fireAtPlayer(origin: Vector3, direction: Vector3) {
        const ray = new Ray(origin, direction, this.attackRange + 5);
        
        const hit = this.scene.pickWithRay(ray, (m) => 
            m !== this.collider && 
            m !== this.mesh && 
            !m.isDescendantOf(this.mesh) &&
            m.name !== "skyBox"
        );

        const hitDistance = (hit && hit.hit) ? hit.distance : this.attackRange + 5;

        this.laser.fire(origin, direction, hitDistance);

        if (hit && hit.hit && hit.pickedMesh && hit.pickedMesh.name === "CharacterTransform") {
            console.log("BJoueur touché !");
        }
    }

    public dispose(): void {
        this.laser.dispose();
        if (this.collider) this.collider.dispose();
        super.dispose();
    }
}