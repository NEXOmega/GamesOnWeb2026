import {
    AbstractMesh,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    TransformNode,
    Vector3,
    MeshBuilder,
    Quaternion,
    PhysicsRaycastResult
} from '@babylonjs/core';
import "@babylonjs/loaders";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import Entity from '../entities/Entity';
import { Collidable } from '../entities/CollidableInterface';
import { State, StateConfig, StateManager } from '../utils/StateManager';
import PlayerHud from '../gui/PlayerHud';
import PlayerCamera from '../camera/PlayerCamera';
import InputManager from '../utils/InputManager'; // Ajuste le chemin selon où tu as créé le fichier
import Inventory from '../player/inventory/Inventory';
import InventoryUI from '../gui/inventory/InventoryHud';
import BaseScene from '../scenes/BaseScene';

export default class Player extends Entity implements Collidable {

    readonly model: AbstractMesh;
    public readonly impostorMesh: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;

    readonly moveSpeed = 14;
    readonly rotationSpeed = 6;

    private jumpStarted = false;
    private jumpHoldTime = 0;
    readonly initialJumpImpulse = 40 * 1000;
    readonly jumpExtendForce = 20 * 1000;
    readonly maxJumpHoldTime = 0.2;

    private coyoteTimeCounter = 0;
    readonly coyoteTimeThreshold = 0.1;

    readonly animationBlendSpeed = 4.0;
    
    readonly playerCamera: PlayerCamera;
    public readonly playerHud: PlayerHud = new PlayerHud();
    
    private inventoryUI = new InventoryUI(StateManager.inventory, this.scene);

    static async CreateAsync(scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<Player> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "Character.glb", scene);
        const model = result.meshes[0];
        
        const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
        cameraAttachPoint.parent = model;
        cameraAttachPoint.position = new Vector3(0, 1.5, 0);

        const camera = new PlayerCamera(cameraAttachPoint, scene);

        return new Player(model, camera, scene, position);
    }

    constructor(mesh: AbstractMesh, camera: PlayerCamera, scene: BaseScene, position: Vector3) {
        super(mesh, scene);
        
        this.impostorMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.impostorMesh.position = position;
        this.impostorMesh.visibility = 0.1;
        this.impostorMesh.rotationQuaternion = Quaternion.Identity();
        this.impostorMesh.metadata = this.mesh.metadata;

        this.model = mesh;
        this.model.parent = this.impostorMesh;
        this.model.rotate(Vector3.Up(), Math.PI);
        this.model.position.y = -1;
        
        this.model.rotationQuaternion = Quaternion.Identity(); 

        this.playerCamera = camera;

        InputManager.onActionJustPressed.add((action) => {
            if (StateManager.state === State.DIALOG) {
                if (action === "interact" || action === "dialog_next") {
                    if (StateManager.currectInteractionEntity) {
                        StateManager.currectInteractionEntity.onInteract(this);
                    }
                }
                return;
            }

            if (StateManager.state === State.PLAYING) {
                if (action === "interact" && StateManager.currectInteractionEntity) {
                    StateManager.currectInteractionEntity.onInteract(this);
                }
            }
        });

        InputManager.onActionJustPressed.add((action) => {
            if(action == "open_inventory") {
                if(StateManager.state != State.PLAYING && StateManager.state != State.IN_INVENTORY)
                    return
                this.inventoryUI.toggle();
            }
        });

        this.physicsAggregate = new PhysicsAggregate(this.impostorMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }
    
    public update(delta: number): void {
        const deltaSeconds = delta / 1000;

        if (!StateConfig[StateManager.state].canMove) {
            this.physicsAggregate.body.setLinearVelocity(new Vector3(0, this.physicsAggregate.body.getLinearVelocity().y, 0));
            return;
        }

        const cameraForward = this.playerCamera.getForwardRay().direction;
        const cameraRight = this.playerCamera.getDirection(Vector3.Right());

        const forward = new Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const right = new Vector3(cameraRight.x, 0, cameraRight.z).normalize();

        let move = Vector3.Zero();

        if (InputManager.isActionPressed("move_forward")) move.addInPlace(forward);
        if (InputManager.isActionPressed("move_backward")) move.subtractInPlace(forward);
        if (InputManager.isActionPressed("move_left")) move.subtractInPlace(right);
        if (InputManager.isActionPressed("move_right")) move.addInPlace(right);

        const scene = this.impostorMesh.getScene();
        const physicsPlugin = scene.getPhysicsEngine().getPhysicsPlugin();
        const raycastOrigin = this.impostorMesh.getAbsolutePosition();
        const raycastEnd = raycastOrigin.add(new Vector3(0, -1.1, 0));

        const result = new PhysicsRaycastResult();
        physicsPlugin.raycast(raycastOrigin, raycastEnd, result);
        
        const isGrounded = result.hasHit && result.hitNormalWorld.y > 0.7;

        if (isGrounded) {
            this.jumpStarted = false;
            this.coyoteTimeCounter = 0;
        } else {
            this.coyoteTimeCounter += deltaSeconds;
        }
        
        const jumpKeyDown = InputManager.isActionPressed("jump");
        const canJump = isGrounded || this.coyoteTimeCounter < this.coyoteTimeThreshold;

        if (jumpKeyDown && canJump && !this.jumpStarted) {
            const currentVel = this.physicsAggregate.body.getLinearVelocity();
            this.physicsAggregate.body.setLinearVelocity(new Vector3(currentVel.x, 0, currentVel.z));

            this.physicsAggregate.body.applyImpulse(new Vector3(0, this.initialJumpImpulse, 0), this.impostorMesh.getAbsolutePosition());
            this.jumpStarted = true;
            this.jumpHoldTime = 0;
        }
        else if (jumpKeyDown && this.jumpStarted) {
            if (this.jumpHoldTime < this.maxJumpHoldTime) {
                this.physicsAggregate.body.applyForce(new Vector3(0, this.jumpExtendForce, 0), this.impostorMesh.getAbsolutePosition());
                this.jumpHoldTime += deltaSeconds;
            }
        }

        if (move.lengthSquared() > 0) {
            move.normalize();

            const targetRotation = Quaternion.FromLookDirectionLH(move, Vector3.Up());
            
            this.model.rotationQuaternion = Quaternion.Slerp(this.model.rotationQuaternion, targetRotation, this.rotationSpeed * deltaSeconds);
            
            const velocity = move.scale(this.moveSpeed);
            this.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, this.physicsAggregate.body.getLinearVelocity().y, velocity.z));
        } else {
            this.physicsAggregate.body.setLinearVelocity(new Vector3(0, this.physicsAggregate.body.getLinearVelocity().y, 0));
        }

        this.playerCamera.handleCameraOcclusion(this, this.impostorMesh.getScene());
    }

    public setPosition(position: Vector3) {
        if (!position) {
            return; 
        }

        this.physicsAggregate.body.disablePreStep = false;
        this.impostorMesh.position.copyFrom(position);
        
        this.physicsAggregate.body.setLinearVelocity(Vector3.Zero());
        this.physicsAggregate.body.setAngularVelocity(Vector3.Zero());

        this.scene.onBeforeRenderObservable.addOnce(() => {
            if (this.physicsAggregate && this.physicsAggregate.body) {
                this.physicsAggregate.body.disablePreStep = true;
            }
        });
    }

    public getCollisionMesh(): AbstractMesh {
        return this.impostorMesh;
    }
}