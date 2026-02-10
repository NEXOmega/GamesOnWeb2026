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
    Scalar
} from '@babylonjs/core';
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import "@babylonjs/loaders";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import Entity from '../entities/Entity';

export default class Player extends Entity {

    //Model mesh for animation and visuals
    readonly model: AbstractMesh;
    //Impostor mesh for physics
    public readonly impostorMesh: AbstractMesh;

    readonly physicsAggregate: PhysicsAggregate;


    readonly moveSpeed = 14;
    readonly rotationSpeed = 6;
    readonly animationBlendSpeed = 4.0;

    vertical = 0;
    verticalAxis = 0;
    horizontal = 0;
    horizontalAxis = 0;

    readonly inputMap: Map<string, boolean>;
    readonly thirdPersonCamera: Camera;

    keyForward = "z";
    keyBackward = "s";
    keyLeft = "q";
    keyRight = "d";

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

        const camera = new ArcRotateCamera("thirdPersonCamera", -1.5, 1.2, 5, Vector3.Zero(), scene);
        camera.attachControl(true);

        camera.lockedTarget = cameraAttachPoint;
        camera.wheelPrecision = 200;
        camera.lowerRadiusLimit = 3;
        camera.upperBetaLimit = 3.14 / 2 + 0.2;

        return new Player(model, camera, scene, position);
    }

    constructor(mesh: AbstractMesh, camera: ArcRotateCamera, scene: Scene, position: Vector3) {
        super(mesh);
        this.impostorMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.impostorMesh.position = position;
        this.impostorMesh.visibility = 0.1;
        this.impostorMesh.rotationQuaternion = Quaternion.Identity();

        this.model = mesh;
        this.model.parent = this.impostorMesh;
        this.model.rotate(Vector3.Up(), Math.PI)
        this.model.position.y = -1

        this.thirdPersonCamera = camera;

        this.inputMap = new Map();
        scene.actionManager = new ActionManager(scene);

        scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
                this.inputMap.set(e.sourceEvent.key, e.sourceEvent.type == "keydown");
            })
        );
        scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
                this.inputMap.set(e.sourceEvent.key, e.sourceEvent.type !== "keyup");
            })
        );

        this.physicsAggregate = new PhysicsAggregate(this.impostorMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0.5 }, scene);
    
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(10);
    }
    
    public update(delta: number): void {
        const deltaSeconds = delta / 1000;

        const cameraForward = this.thirdPersonCamera.getForwardRay().direction;
        const cameraRight = this.thirdPersonCamera.getDirection(Vector3.Right());

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

        if (move.lengthSquared() > 0) {
            move.normalize();

            const targetRotation = Quaternion.FromLookDirectionLH(move, Vector3.Up());
            this.model.rotationQuaternion = Quaternion.Slerp(this.model.rotationQuaternion, targetRotation, this.rotationSpeed * deltaSeconds);
            
            const velocity = move.scale(this.moveSpeed);
            this.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, this.physicsAggregate.body.getLinearVelocity().y, velocity.z));
        }
    }

    public setPosition(position: Vector3) {
        this.impostorMesh.position = position;
    }
}
