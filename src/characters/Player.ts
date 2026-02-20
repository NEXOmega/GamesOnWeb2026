import {
    AbstractMesh,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    TransformNode,
    Vector3,
    ArcRotateCamera,
    MeshBuilder,
    Quaternion,
    Camera,
    Scalar,
    PhysicsRaycastResult,
    Ray
} from '@babylonjs/core';
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import "@babylonjs/loaders";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import Entity from '../entities/Entity';
import { Collidable } from '../entities/CollidableInterface';
import { State, StateManager } from '../utils/StateManager';
import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
import PlayerHud from '../gui/PlayerHud';
import PlayerCamera from '../camera/PlayerCamera';

export default class Player extends Entity implements Collidable {

    //Model mesh for animation and visuals
    readonly model: AbstractMesh;
    //Impostor mesh for physics
    public readonly impostorMesh: AbstractMesh;

    readonly physicsAggregate: PhysicsAggregate;


    readonly moveSpeed = 14;
    readonly rotationSpeed = 6;

    private jumpStarted = false;
    private jumpHoldTime = 0;
    readonly initialJumpImpulse = 40 * 1000;
    readonly jumpExtendForce = 90 * 1000;
    readonly maxJumpHoldTime = 0.2;

    private coyoteTimeCounter = 0;
    readonly coyoteTimeThreshold = 0.1;

    readonly animationBlendSpeed = 4.0;

    readonly inputMap: Map<string, boolean>;
    
    readonly playerCamera: PlayerCamera;

    public readonly playerHud: PlayerHud = new PlayerHud();

    keyForward = "z";
    keyBackward = "s";
    keyLeft = "q";
    keyRight = "d";
    keyJump = " ";
    keyInteract = "e";


    static async CreateAsync(scene: Scene, position: Vector3 = Vector3.Zero()): Promise<Player> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Character.glb",
            scene
        );

        const model = result.meshes[0];
        
        const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
        cameraAttachPoint.parent = model;
        cameraAttachPoint.position = new Vector3(0, 1.5, 0);

        const camera = new PlayerCamera(cameraAttachPoint, scene);

        return new Player(model, camera, scene, position);
    }

    constructor(mesh: AbstractMesh, camera: PlayerCamera, scene: Scene, position: Vector3) {
        super(mesh, scene);
        this.impostorMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.impostorMesh.position = position;
        this.impostorMesh.visibility = 0.1;
        this.impostorMesh.rotationQuaternion = Quaternion.Identity();

        this.model = mesh;
        this.model.parent = this.impostorMesh;
        this.model.rotate(Vector3.Up(), Math.PI)
        this.model.position.y = -1

        this.playerCamera = camera;

        this.inputMap = new Map();
        scene.actionManager = new ActionManager(scene);

        scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
                if(StateManager.state === State.PLAYING)
                    this.inputMap.set(e.sourceEvent.key, e.sourceEvent.type == "keydown");
            })
        );
        scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
                if(StateManager.state != State.PLAYING)
                    return;
                this.inputMap.set(e.sourceEvent.key, e.sourceEvent.type !== "keyup");
                if(e.sourceEvent.key === this.keyInteract) {
                    if(StateManager.currectInteractionEntity) {
                        StateManager.currectInteractionEntity.onInteract(this);
                    }
                }
            })
        );

        this.physicsAggregate = new PhysicsAggregate(this.impostorMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
    
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }
    
    public update(delta: number): void {
        const deltaSeconds = delta / 1000;

        const cameraForward = this.playerCamera.getForwardRay().direction;
        const cameraRight = this.playerCamera.getDirection(Vector3.Right());

        const forward = new Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const right = new Vector3(cameraRight.x, 0, cameraRight.z).normalize();

        let move = Vector3.Zero();

        if (this.inputMap.get(this.keyForward)) {
            move.addInPlace(forward);
        }
        if (this.inputMap.get(this.keyBackward)) {
            move.subtractInPlace(forward);
        }
        if (this.inputMap.get(this.keyLeft)) {
            move.subtractInPlace(right);
        }
        if (this.inputMap.get(this.keyRight)) {
            move.addInPlace(right);
        }

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
        
        const jumpKeyDown = this.inputMap.get(this.keyJump);
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
        this.impostorMesh.position = position;
    }

    public getCollisionMesh(): AbstractMesh {
        return this.impostorMesh;
    }
}
