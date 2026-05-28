import {
    AbstractMesh,
    Color3,
    Mesh,
    MeshBuilder,
    Observer,
    PhysicsAggregate,
    PhysicsShapeType,
    Quaternion,
    Ray,
    Scalar,
    StandardMaterial,
    TransformNode,
    Vector3,
} from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { RecastJSPlugin } from "@babylonjs/core/Navigation/Plugins/recastJSPlugin";
import Recast from "recast-detour";

import Player from "../characters/Player";
import Entity from "../entities/Entity";
import BaseScene from "../scenes/BaseScene";

// Machine à états pour le comportement de l'IA
enum IaState {
    PATROL,  // Patrouille en cercle autour de la position d'origine
    CHASE,   // Poursuit le joueur visible dans le FOV
    SEARCH,  // Va à la dernière position connue du joueur
    RETURN,  // Retourne à la position d'origine
}

export default class IANavigation extends Entity {
    // Paramètres de navigation (NavMesh)
    private parameters = {
        cs: 0.2,
        ch: 0.2,
        walkableSlopeAngle: 35,
        walkableHeight: 5,
        walkableClimb: 10,
        walkableRadius: 1,
        maxEdgeLen: 19,
        maxSimplificationError: 1.3,
        minRegionArea: 8,
        mergeRegionArea: 20,
        maxVertsPerPoly: 6,
        detailSampleDist: 6,
        detailSampleMaxError: 1,
    };

    // Paramètres de l'agent dans le crowd
    private agentParameters = {
        collisionQueryRange: 1,
        height: 2,
        maxAcceleration: 3,
        maxSpeed: 2,
        pathOptimizationRange: 1,
        radius: 0.2,
        reachRadius: 3,
        separationWeight: 1,
    };

    private navigationPlugin: RecastJSPlugin;
    private crowd: any;
    private agentId: number = -1;
    private agentTransform?: TransformNode;
    private targetPlayer?: Player;

    // Collision physique (trigger) — pilotée par le crowd, kinematic.
    private collider?: AbstractMesh;
    private physicsAggregate?: PhysicsAggregate;
    private collisionObserver?: Observer<any>;
    private readonly killRadius: number = 1.2;

    // Dégâts au contact
    public contactDamage: number = 25;
    public damageCooldownMs: number = 1000;
    private damageCooldownTimer: number = 0;
    private isTouchingPlayer: boolean = false;

    private repathTimeMs = 0;
    private repathEveryMs = 250;

    private roundAngle: number = 0;
    private roundCenter: Vector3 = Vector3.Zero();

    private lastKnownPlayerPos: Vector3 = Vector3.Zero();
    private originalIaPlacement: Vector3 = Vector3.Zero();

    private readonly arrivalThreshold: number = 1.5;

    private state: IaState = IaState.PATROL;

    constructor(
        id: string,
        mesh: AbstractMesh,
        scene: BaseScene,
        position?: Vector3,
        rotation?: Vector3,
        scale?: Vector3,
    ) {
        super(id, mesh, scene, position, rotation, scale);
    }

    static async CreateAsync(
        id: string,
        scene: BaseScene,
        position: Vector3 = Vector3.Zero(),
        rotation?: Vector3,
        scale?: Vector3,
    ): Promise<IANavigation> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./assets/models/",
            "Character.glb",
            scene,
        );

        const model = result.meshes[0];
        return new IANavigation(id, model, scene, position, rotation, scale);
    }

    public async CreateNavMesh(debug: boolean): Promise<void> {
        const staticMeshes = this.scene.meshes.filter(
            (mesh) =>
                mesh.getTotalIndices() > 0 &&
                mesh.checkCollisions === true &&
                mesh instanceof Mesh,
        ) as Mesh[];

        const recast = await Recast();
        this.navigationPlugin = new RecastJSPlugin(recast);
        this.navigationPlugin.createNavMesh(staticMeshes, this.parameters);

        if (debug) {
            this.NavMeshDebug(this.navigationPlugin);
        }
    }

    private NavMeshDebug(navigationPlugin: RecastJSPlugin): void {
        const navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
        const matdebug = new StandardMaterial("matdebug", this.scene);
        matdebug.diffuseColor = new Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;
    }

    public IaToPlayer(player: Player): void {
        if (!this.navigationPlugin) {
            console.error(`[IANavigation] ${this.id} : CreateNavMesh() must be called first.`);
            return;
        }

        this.targetPlayer = player;

        if (!this.crowd) {
            this.mesh.computeWorldMatrix(true);

            const snappedPos = this.navigationPlugin.getClosestPoint(
                this.mesh.getAbsolutePosition(),
            );

            this.crowd = this.navigationPlugin.createCrowd(1, 0.5, this.scene);
            this.agentTransform = new TransformNode(this.id + "_agentTransform", this.scene);
            this.agentTransform.position.copyFrom(snappedPos);

            this.originalIaPlacement = snappedPos.clone();
            this.roundCenter = snappedPos.clone();

            this.agentId = this.crowd.addAgent(snappedPos, this.agentParameters, this.agentTransform);

            this.createCollisionBody(snappedPos);
        }
    }

    private createCollisionBody(initialPos: Vector3): void {
        this.collider = MeshBuilder.CreateSphere(
            this.id + "_damageCollider",
            { diameter: this.killRadius * 2 },
            this.scene,
        );
        this.collider.position.copyFrom(initialPos);
        this.collider.visibility = 0;
        this.collider.isPickable = false;

        this.physicsAggregate = new PhysicsAggregate(
            this.collider,
            PhysicsShapeType.SPHERE,
            { mass: 0, restitution: 0, friction: 0 },
            this.scene,
        );

        const body = this.physicsAggregate.body;
        body.setCollisionCallbackEnabled(true);

        this.collisionObserver = body
            .getCollisionObservable()
            .add((event) => this.onCollision(event));
    }

    private onCollision(event: any): void {
        if (!this.targetPlayer) return;

        const otherMesh: AbstractMesh | undefined =
            event.collidedAgainst?.transformNode as AbstractMesh | undefined;
        if (!otherMesh) return;

        const playerMesh = this.targetPlayer.impostorMesh;
        const hitPlayer =
            otherMesh === playerMesh ||
            otherMesh === (this.targetPlayer as any).model ||
            otherMesh.isDescendantOf?.(playerMesh);

        if (!hitPlayer) return;

        // Le joueur est en contact ; le tick de dégâts est géré dans update().
        this.isTouchingPlayer = true;

        // Dégât immédiat si pas en cooldown.
        this.tryApplyDamage();
    }

    private tryApplyDamage(): void {
        if (!this.targetPlayer || this.damageCooldownTimer > 0) return;

        const p: any = this.targetPlayer;
        if (typeof p.takeDamage === "function") {
            p.takeDamage(this.contactDamage);
        } else {
            console.log(`[IANavigation] ${this.id} touche le joueur (méthode takeDamage absente).`);
        }
        this.damageCooldownTimer = this.damageCooldownMs;
    }

    public checkPlayerInFovIa(angleFov: number): boolean {
        const agentPos = this.crowd.getAgentPosition(this.agentId);
        const playerPos = this.targetPlayer.impostorMesh.getAbsolutePosition();

        const diff = playerPos.subtract(agentPos);
        const dist = diff.length();
        const vecPlayer = diff.normalize();

        const vel = this.crowd.getAgentVelocity(this.agentId);
        const vecAgent =
            vel.length() > 0.01
                ? vel.normalize()
                : Vector3.Forward().applyRotationQuaternionInPlace(
                    Quaternion.FromEulerAngles(0, this.mesh.rotation.y, 0),
                );

        const dot = Vector3.Dot(vecAgent, vecPlayer);
        const angleBetween = Math.acos(Scalar.Clamp(dot, -1, 1));
        const fovRad = (angleFov / 2) * (Math.PI / 180);

        if (angleBetween > fovRad) return false;

        const ray = new Ray(agentPos, vecPlayer, dist);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            if (mesh === this.targetPlayer.impostorMesh) return true;
            if (mesh === this.mesh) return false;
            if (mesh.isDescendantOf(this.mesh)) return false;
            if (mesh === this.collider) return false;
            if (mesh.name === "Alpha_Surface") return false;
            return mesh.isPickable;
        });

        if (!hit || !hit.hit || !hit.pickedMesh) return false;
        return hit.pickedMesh === this.targetPlayer.impostorMesh;
    }

    public followPlayer(): void {
        const destination = this.targetPlayer.impostorMesh.getAbsolutePosition();
        const from = this.crowd.getAgentPosition(this.agentId);
        const to = this.navigationPlugin.getClosestPoint(destination);
        const pathPoints = this.navigationPlugin.computePath(from, to);

        if (pathPoints.length > 0) {
            this.crowd.agentGoto(this.agentId, pathPoints[pathPoints.length - 1]);
        }
    }

    private goToLastKnownPlayerPosition(): void {
        const to = this.navigationPlugin.getClosestPoint(this.lastKnownPlayerPos);
        this.crowd.agentGoto(this.agentId, to);
    }

    private IaRound(radius: number, deltaMs: number): void {
        this.roundAngle += (deltaMs * Math.PI * 2) / 10000;

        const dest = new Vector3(
            this.roundCenter.x + radius * Math.cos(this.roundAngle),
            this.roundCenter.y,
            this.roundCenter.z + radius * Math.sin(this.roundAngle),
        );

        const to = this.navigationPlugin.getClosestPoint(dest);
        this.crowd.agentGoto(this.agentId, to);
    }

    public update(deltaMs: number): void {
        if (!this.navigationPlugin || !this.crowd || this.agentId < 0 || !this.targetPlayer) {
            return;
        }

        if (this.agentTransform) {
            this.mesh.position.copyFrom(this.agentTransform.position);

            if (this.collider && this.physicsAggregate) {
                this.collider.position.copyFrom(this.agentTransform.position);
                this.physicsAggregate.body.disablePreStep = false;
            }
        }

        // Cooldown des dégâts
        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer = Math.max(0, this.damageCooldownTimer - deltaMs);
        }

        // Tant que le joueur est en contact, on ré-applique les dégâts à chaque fin de cooldown.
        // isTouchingPlayer est remis à true à chaque event de collision, et reset ici à false ;
        // si la collision n'est plus signalée pendant un frame, on considère que le contact a cessé.
        if (this.isTouchingPlayer) {
            this.tryApplyDamage();
            this.isTouchingPlayer = false;
        }

        const playerInFov = this.checkPlayerInFovIa(250);
        const agentPos: Vector3 = this.crowd.getAgentPosition(this.agentId);

        switch (this.state) {

            case IaState.PATROL:
                if (playerInFov) {
                    this.state = IaState.CHASE;
                } else {
                    this.IaRound(5, deltaMs);
                }
                break;

            case IaState.CHASE:
                if (playerInFov) {
                    this.lastKnownPlayerPos = this.targetPlayer.impostorMesh
                        .getAbsolutePosition()
                        .clone();

                    this.repathTimeMs += deltaMs;
                    if (this.repathTimeMs >= this.repathEveryMs) {
                        this.repathTimeMs = 0;
                        this.followPlayer();
                    }
                } else {
                    this.state = IaState.SEARCH;
                    this.repathTimeMs = 0;
                    this.goToLastKnownPlayerPosition();
                }
                break;

            case IaState.SEARCH:
                if (playerInFov) {
                    this.state = IaState.CHASE;
                } else {
                    const distToLastPos = Vector3.Distance(agentPos, this.lastKnownPlayerPos);
                    if (distToLastPos < this.arrivalThreshold) {
                        this.state = IaState.RETURN;
                        const to = this.navigationPlugin.getClosestPoint(this.originalIaPlacement);
                        this.crowd.agentGoto(this.agentId, to);
                    }
                }
                break;

            case IaState.RETURN:
                if (playerInFov) {
                    this.state = IaState.CHASE;
                } else {
                    const distToOrigin = Vector3.Distance(agentPos, this.originalIaPlacement);
                    if (distToOrigin < this.arrivalThreshold) {
                        this.state = IaState.PATROL;
                        this.roundCenter = this.originalIaPlacement.clone();
                        this.roundAngle = 0;
                    }
                }
                break;
        }

        const velocity = this.crowd.getAgentVelocity(this.agentId);
        if (velocity.length() > 0.05) {
            const desiredRotation = Math.atan2(velocity.x, velocity.z);
            this.mesh.rotation.y += (desiredRotation - this.mesh.rotation.y) * 0.1;
        }
    }

    public dispose(): void {
        if (this.collisionObserver && this.physicsAggregate) {
            this.physicsAggregate.body.getCollisionObservable().remove(this.collisionObserver);
            this.collisionObserver = undefined;
        }
        if (this.physicsAggregate) {
            this.physicsAggregate.dispose();
            this.physicsAggregate = undefined;
        }
        if (this.collider) {
            this.collider.dispose();
            this.collider = undefined;
        }
        if (this.crowd && this.agentId >= 0) {
            this.crowd.removeAgent(this.agentId);
        }
        if (this.agentTransform) {
            this.agentTransform.dispose();
        }
        super.dispose();
    }

    public GetNavPlugin(): RecastJSPlugin {
        return this.navigationPlugin;
    }
}