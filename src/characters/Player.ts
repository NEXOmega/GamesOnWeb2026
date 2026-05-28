import "@babylonjs/loaders";

import {
    AbstractMesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsRaycastResult,
    PhysicsShapeType,
    Quaternion,
    TransformNode,
    Vector3} from '@babylonjs/core';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import PlayerCamera from '../camera/PlayerCamera';
import { Collidable } from '../entities/CollidableInterface';
import Entity from '../entities/Entity';
import InventoryUI from '../gui/inventory/InventoryHud';
import PlayerHud from '../gui/PlayerHud';
import * as TitleAnimation from '../gui/title/TitleAnimation';
import UsableRegistry from "../items/UsableRegistry";
import Inventory from '../player/inventory/Inventory';
import BaseScene from '../scenes/BaseScene';
import InputManager from '../utils/InputManager';
import { State, StateConfig, StateManager } from '../utils/StateManager';

export default class Player extends Entity implements Collidable {

    readonly model: AbstractMesh;
    public readonly impostorMesh: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;

    readonly moveSpeed = 14;
    readonly rotationSpeed = 6;

    private jumpStarted = false;
    private jumpHoldTime = 0;
    readonly initialJumpImpulse = 6 * 1000;
    readonly jumpExtendForce = 4 * 1000;
    readonly maxJumpHoldTime = 0.2;

    private coyoteTimeCounter = 0;
    readonly coyoteTimeThreshold = 0.1;

    readonly animationBlendSpeed = 4.0;

    readonly playerCamera: PlayerCamera;
    public readonly playerHud: PlayerHud = new PlayerHud();

    private inventoryUI = new InventoryUI(
        StateManager.inventory,
        this.scene,
        (itemId) => {
            const usable = UsableRegistry.get(itemId);
            usable?.use(this);
        }
    );

    // === Système de PV ===
    public readonly maxHealth: number = 100;
    private _health: number = 100;
    private _isDead: boolean = false;
    private _stateBeforeDeath: State = State.PLAYING;

    public get health(): number { return this._health; }
    public get isDead(): boolean { return this._isDead; }

    // Position de spawn initiale, capturée à la création
    private _initialSpawnPosition: Vector3;

    public selectedItemId: string | null = null;

    static async CreateAsync(scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<Player> {
        const result = await SceneLoader.ImportMeshAsync("", "./assets/models/", "Character.glb", scene);
        const model = result.meshes[0];

        const cameraAttachPoint = new TransformNode("cameraAttachPoint", scene);
        cameraAttachPoint.parent = model;
        cameraAttachPoint.position = new Vector3(0, 1.5, 0);

        const camera = new PlayerCamera(cameraAttachPoint, scene);

        return new Player(model, camera, scene, position);
    }

    constructor(mesh: AbstractMesh, camera: PlayerCamera, scene: BaseScene, position: Vector3) {
        super("player", mesh, scene);

        this.impostorMesh = MeshBuilder.CreateCapsule("CharacterTransform", { height: 1.30, radius: 0.25 }, scene);
        this.impostorMesh.position = position;
        this.impostorMesh.visibility = 0.1;
        this.impostorMesh.rotationQuaternion = Quaternion.Identity();
        this.impostorMesh.metadata = this.mesh.metadata;

        this.model = mesh;
        this.model.parent = this.impostorMesh;
        this.model.position.y = -0.65;
        this.model.scaling = new Vector3(0.3, 0.3, 0.3);

        this.model.rotationQuaternion = Quaternion.Identity();

        this.playerCamera = camera;

        this.physicsAggregate = new PhysicsAggregate(this.impostorMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);

        this._initialSpawnPosition = position.clone();

        this.refreshHealthHud();
    }

    public takeDamage(amount: number): void {
        if (this._isDead || amount <= 0) return;

        this._health = Math.max(0, this._health - amount);
        this.refreshHealthHud();

        if (this._health <= 0) {
            this.die();
        }
    }

    public heal(amount: number): void {
        if (this._isDead || amount <= 0) return;
        this._health = Math.min(this.maxHealth, this._health + amount);
        this.refreshHealthHud();
    }

    /**
     * Mort du joueur : passe en State.DEAD, fade-in du titre "VOUS ÊTES MORT"
     * (qui reste affiché jusqu'au respawn), et bouton Respawn.
     */
    public die(): void {
        if (this._isDead) return;
        this._isDead = true;

        this._stateBeforeDeath = StateManager.state;
        StateManager.state = State.DEAD;

        this.physicsAggregate.body.setLinearVelocity(Vector3.Zero());
        this.physicsAggregate.body.setAngularVelocity(Vector3.Zero());


        const title = this.playerHud.title;
        title.clearQueue();
        title.skipCurrent();
        title.enqueueFront({
            text: "VOUS ÊTES MORT",
            animation: new TitleAnimation.AnimationSequence([
                new TitleAnimation.FadeAnimation(400, 0, 1),
                new TitleAnimation.WaitAnimation(Number.MAX_SAFE_INTEGER),
            ]),
        });

        this.playerHud.showRespawnButton(() => this.respawn());

        console.log("[Player] mort");
    }

    private refreshHealthHud(): void {
        if (this.playerHud && typeof this.playerHud.updateHealthBar === "function") {
            this.playerHud.updateHealthBar(this._health, this.maxHealth);
        }
    }

    public update(delta: number): void {
        const deltaSeconds = delta / 1000;

        if (InputManager.isActionJustPressed("open_inventory")) {
            if (StateManager.state === State.PLAYING || StateManager.state === State.IN_INVENTORY) {
                this.inventoryUI.toggle();
            }
        }

        if (InputManager.isActionJustPressed("use_item")) {
            const selected = this.inventoryUI.selectedItemId;
            if (selected) {
                const usable = UsableRegistry.get(selected);
                usable?.use(this);
            }
        }

        if (StateManager.state === State.DIALOG) {
            if (InputManager.isActionJustPressed("interact") || InputManager.isActionJustPressed("dialog_next")) {
                if (this.scene.currectInteractionEntity) {
                    this.scene.currectInteractionEntity.onInteract(this);
                }
            }
        } else if (StateManager.state === State.PLAYING) {
            if (InputManager.isActionJustPressed("interact") && this.scene.currectInteractionEntity) {
                this.scene.currectInteractionEntity.onInteract(this);
            }
        }

        if (!StateConfig[StateManager.state].canMove) {
            this.physicsAggregate.body.setLinearVelocity(new Vector3(0, this.physicsAggregate.body.getLinearVelocity().y, 0));
            return;
        }

        const cameraForward = this.playerCamera.getForwardRay().direction;
        const cameraRight = this.playerCamera.getDirection(Vector3.Right());

        const forward = new Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const right = new Vector3(cameraRight.x, 0, cameraRight.z).normalize();

        const move = Vector3.Zero();

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
            this.physicsAggregate.body.setGravityFactor(1);

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

            this.physicsAggregate.body.setGravityFactor(1);

            if (!this.model.rotationQuaternion) {
                this.model.rotationQuaternion = Quaternion.Identity();
            }

            const targetRotation = Quaternion.FromLookDirectionLH(move, Vector3.Up());

            this.model.rotationQuaternion = Quaternion.Slerp(this.model.rotationQuaternion, targetRotation, this.rotationSpeed * deltaSeconds);

            const velocity = move.scale(this.moveSpeed);
            this.physicsAggregate.body.setLinearVelocity(new Vector3(velocity.x, this.physicsAggregate.body.getLinearVelocity().y, velocity.z));
        } else {
            if (isGrounded && !this.jumpStarted) {
                this.physicsAggregate.body.setGravityFactor(0);
                this.physicsAggregate.body.setLinearVelocity(Vector3.Zero());
            } else {
                this.physicsAggregate.body.setGravityFactor(1);
                this.physicsAggregate.body.setLinearVelocity(new Vector3(0, this.physicsAggregate.body.getLinearVelocity().y, 0));
            }
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

    /**
     * Respawn au point initial. Réinitialise PV, état et UI.
     */
    public respawn(): void {
        const spawnPos = this._initialSpawnPosition ?? this.scene.playerSpawn;
        this.setPosition(spawnPos);

        this._health = this.maxHealth;
        this._isDead = false;

        // Cache l'UI de mort
        this.playerHud.hideRespawnButton();
        this.playerHud.title.clearQueue();
        this.playerHud.title.skipCurrent();
        // Force le titre à devenir invisible immédiatement (sinon il reste à alpha=1)
        this.playerHud.title.text.alpha = 0;

        // Rétablit l'état précédent (par défaut PLAYING)
        StateManager.state = this._stateBeforeDeath === State.DEAD ? State.PLAYING : this._stateBeforeDeath;

        this.refreshHealthHud();
    }

    public getInventory() : Inventory {
        return StateManager.inventory;
    }

}