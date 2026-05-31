import Entity from "../entities/Entity";
import { RecastJSPlugin } from "@babylonjs/core/Navigation/Plugins/recastJSPlugin";
import Recast from "recast-detour";
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
import Player from "../characters/Player";
import BaseScene from "../scenes/BaseScene";

enum IaState {
    PATROL,  // Patrouille en cercle autour de la position d'origine
    CHASE,   // Poursuit le joueur visible dans le FOV
    SEARCH,  // Va à la dernière position connue du joueur
    RETURN,  // Retourne à la position d'origine
}

export default class IANavigation extends Entity {

    // Paramètres de l'agent dans le crowd
    private agentParameters = {
        collisionQueryRange: 1,
        height: 2,
        maxAcceleration: 60,
        maxSpeed: 18,
        pathOptimizationRange: 3,
        radius: 0.3,
        reachRadius: 1.0,
        separationWeight: 1,
    };
    // Paramètres de navigation (NavMesh)

    private static readonly navMeshParameters = {
        cs: 0.3, ch: 0.3,
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

    private navigationPlugin: RecastJSPlugin;
    private crowd: any;
    private agentId: number = -1;
    private agentTransform?: TransformNode;
    private targetPlayer?: Player;
    private prevPlayerPos?: Vector3;
    private playerVelocity: Vector3 = Vector3.Zero();


    private collider?: AbstractMesh;
    private physicsAggregate?: PhysicsAggregate;
    private collisionObserver?: Observer<any>;
    private readonly killRadius: number = 1.2;

    public contactDamage: number = 25;
    public damageCooldownMs: number = 1000;
    private damageCooldownTimer: number = 0;
    private isTouchingPlayer: boolean = false;

    private patrolRadius = 8;
    private patrolTarget?: Vector3;
    private patrolPauseMs = 0;
    private patrolLookHeading = 0;
    private readonly patrolArrivalDist = 1.2;

    private readonly detectionRange = 50;
    private lastRepathTarget: Vector3 = Vector3.Zero();

    private repathTimeMs = 0;
    private repathEveryMs = 250;

    private roundCenter: Vector3 = Vector3.Zero();

    private lastKnownPlayerPos: Vector3 = Vector3.Zero();
    private originalIaPlacement: Vector3 = Vector3.Zero();

    private readonly arrivalThreshold: number = 1.5;

    private state: IaState = IaState.PATROL;

    private readonly chaseSpeed = 18;
    private readonly chaseAccel = 60;
    private readonly calmSpeed = 6;
    private readonly calmAccel = 20;
    private currentMaxSpeed = -1;

    private static sharedPlugin?: RecastJSPlugin;
    private static sharedCrowd?: any;
    private static sharedScene?: BaseScene;

    private static readonly modelScale = 3;

    constructor(
        id: string,
        mesh: AbstractMesh,
        scene: BaseScene,
        position?: Vector3,
        rotation?: Vector3,
        scale?: Vector3,
    ) {
        super(id, mesh, scene, position, rotation, scale);
        this.scene.entityManager.addEntity(this);
    }

    static async CreateAsync(
        id: string,
        scene: BaseScene,
        position: Vector3 = Vector3.Zero(),
        rotation?: Vector3,
        scale?: Vector3,
    ): Promise<IANavigation> {
        const result = await SceneLoader.ImportMeshAsync("", "./assets/models/", "Robot.glb", scene);
        const model = result.meshes[0];

        const robot = new IANavigation(id, model, scene, position, rotation, scale);
        model.scaling.scaleInPlace(IANavigation.modelScale);
        return robot;
    }


    private NavMeshDebug(navigationPlugin: RecastJSPlugin): void {
        const navmeshdebug = navigationPlugin.createDebugNavMesh(this.scene);
        const matdebug = new StandardMaterial("matdebug", this.scene);
        matdebug.diffuseColor = new Color3(0.1, 0.2, 1);
        matdebug.alpha = 0.2;
        navmeshdebug.material = matdebug;
    }

    public IaToPlayer(player: Player): void {
        const plugin = IANavigation.sharedPlugin;
        const crowd = IANavigation.sharedCrowd;
        if (!plugin || !crowd) {
            console.error(`[IANavigation] ${this.id} : InitNavigation() doit être appelé avant.`);
            return;
        }

        this.navigationPlugin = plugin;
        this.crowd = crowd;
        this.targetPlayer = player;

        if (this.agentId < 0) {
            this.mesh.computeWorldMatrix(true);
            const absolutePos = this.mesh.getAbsolutePosition();

            let snappedPos = plugin.getClosestPoint(absolutePos);
            if (Vector3.Distance(snappedPos, absolutePos) > 15) {
                snappedPos = plugin.getClosestPoint(new Vector3(absolutePos.x, 0, absolutePos.z));
            }

            this.agentTransform = new TransformNode(this.id + "_agentTransform", this.scene);
            this.agentTransform.position.copyFrom(snappedPos);
            this.originalIaPlacement = snappedPos.clone();
            this.roundCenter = snappedPos.clone();

            this.agentId = crowd.addAgent(snappedPos, this.agentParameters, this.agentTransform);
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
        if (dist > this.detectionRange) return false;

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

    public followPlayer(target?: Vector3): void {
        const destination = target ?? this.targetPlayer.impostorMesh.getAbsolutePosition();
        const to = this.navigationPlugin.getClosestPoint(destination);
        this.crowd.agentGoto(this.agentId, to);
    }

    private goToLastKnownPlayerPosition(): void {
        const to = this.navigationPlugin.getClosestPoint(this.lastKnownPlayerPos);
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

        const currentPlayerPos = this.targetPlayer.impostorMesh.getAbsolutePosition();
        if (this.prevPlayerPos && deltaMs > 0) {
            const instantVel = currentPlayerPos
                .subtract(this.prevPlayerPos)
                .scaleInPlace(1000 / deltaMs);
            this.playerVelocity = Vector3.Lerp(this.playerVelocity, instantVel, 0.2);
        }
        this.prevPlayerPos = currentPlayerPos.clone();

        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer = Math.max(0, this.damageCooldownTimer - deltaMs);
        }

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
                    this.patrolPauseMs = 0;
                    this.patrolTarget = undefined;
                } else {
                    this.patrol(deltaMs);
                }
                break;

            case IaState.CHASE:
                if (playerInFov) {
                    const playerPos = this.targetPlayer.impostorMesh.getAbsolutePosition();
                    this.lastKnownPlayerPos = playerPos.clone();

                    // ← tes 3 lignes vont ici
                    const lead = this.playerVelocity.scale(0.4); // 0.3–0.5s d'anticipation
                    lead.y = 0;                                  // on reste sur le plan du sol
                    const predicted = playerPos.add(lead);

                    this.repathTimeMs += deltaMs;
                    const moved = Vector3.Distance(predicted, this.lastRepathTarget) > 0.75;
                    if (this.repathTimeMs >= this.repathEveryMs && moved) {
                        this.repathTimeMs = 0;
                        this.lastRepathTarget = predicted.clone();
                        this.followPlayer(predicted);   // on passe la cible prédite
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
                        this.patrolTarget = undefined;
                        this.patrolPauseMs = 0;
                    }
                }
                break;

        }

        if (this.state === IaState.CHASE) {
            this.setAgentSpeed(this.chaseSpeed, this.chaseAccel);
        } else {
            this.setAgentSpeed(this.calmSpeed, this.calmAccel);
        }

        const velocity = this.crowd.getAgentVelocity(this.agentId);
        if (velocity.length() > 0.05) {
            const desiredRotation = Math.atan2(velocity.x, velocity.z);

            let diff = desiredRotation - this.mesh.rotation.y;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));

            const t = 1 - Math.exp(-6 * (deltaMs / 1000));
            this.mesh.rotation.y += diff * t;
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

    private patrol(deltaMs: number): void {
        if (this.patrolPauseMs > 0) {
            this.patrolPauseMs -= deltaMs;

            let diff = this.patrolLookHeading - this.mesh.rotation.y;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            this.mesh.rotation.y += diff * (1 - Math.exp(-3 * (deltaMs / 1000)));

            if (this.patrolPauseMs <= 0) this.pickNewPatrolTarget();
            return;
        }

        if (!this.patrolTarget) {
            this.pickNewPatrolTarget();
            return;
        }

        const agentPos = this.crowd.getAgentPosition(this.agentId);
        if (Vector3.Distance(agentPos, this.patrolTarget) < this.patrolArrivalDist) {
            this.patrolPauseMs = 800 + Math.random() * 2200;
            this.patrolLookHeading = Math.random() * Math.PI * 2;  // direction au hasard
            this.patrolTarget = undefined;
        }
    }

    private pickNewPatrolTarget(): void {
        for (let i = 0; i < 5; i++) {
            const point = this.navigationPlugin.getRandomPointAround(this.roundCenter, this.patrolRadius);

            if (point.lengthSquared() === 0) continue;
            if (Vector3.Distance(point, this.roundCenter) > this.patrolRadius * 1.5) continue;

            const agentPos = this.crowd.getAgentPosition(this.agentId);
            if (Vector3.Distance(point, agentPos) < 2) continue; // évite les micro-pas

            this.patrolTarget = point.clone();
            this.crowd.agentGoto(this.agentId, point);
            return;
        }
        this.patrolPauseMs = 500;
    }

    private setAgentSpeed(maxSpeed: number, maxAcceleration: number): void {
        if (maxSpeed === this.currentMaxSpeed) return; // déjà à cette vitesse => rien à faire
        this.currentMaxSpeed = maxSpeed;
        this.agentParameters.maxSpeed = maxSpeed;
        this.agentParameters.maxAcceleration = maxAcceleration;
        this.crowd.updateAgentParameters(this.agentId, this.agentParameters);
    }
    public static async InitNavigation(scene: BaseScene, maxAgents: number, debug = false): Promise<void> {
        if (IANavigation.sharedPlugin && IANavigation.sharedScene === scene) return;

        const staticMeshes = scene.meshes.filter(
            (m) => m.getTotalIndices() > 0 && m.checkCollisions === true && m instanceof Mesh,
        ) as Mesh[];

        const recast = await Recast();
        const plugin = new RecastJSPlugin(recast);
        plugin.createNavMesh(staticMeshes, IANavigation.navMeshParameters);

        IANavigation.sharedPlugin = plugin;
        IANavigation.sharedCrowd = plugin.createCrowd(Math.max(maxAgents, 1), 0.5, scene);
        IANavigation.sharedScene = scene;

        if (debug) {
            const dbg = plugin.createDebugNavMesh(scene);
            const mat = new StandardMaterial("navdebug", scene);
            mat.diffuseColor = new Color3(0.1, 0.2, 1);
            mat.alpha = 0.2;
            dbg.material = mat;
        }
    }

    public static DisposeNavigation(): void {
        IANavigation.sharedCrowd?.dispose?.();
        IANavigation.sharedPlugin?.dispose?.();
        IANavigation.sharedCrowd = undefined;
        IANavigation.sharedPlugin = undefined;
        IANavigation.sharedScene = undefined;
    }

}