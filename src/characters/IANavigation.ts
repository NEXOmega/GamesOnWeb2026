import Entity from "../entities/Entity";
import { RecastJSPlugin } from "@babylonjs/core/Navigation/Plugins/recastJSPlugin";
import Recast from "recast-detour";
import {
    AbstractMesh,
    Color3,
    Mesh, MeshBuilder, Observer,
    Quaternion,
    Ray,
    Scalar,
    Scene,
    StandardMaterial,
    TransformNode,
    Vector3,
} from "@babylonjs/core";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import Player from "./Player";
import BaseScene from "../scenes/BaseScene";
import DroneEnemy from "./DroneEnemy";

// Machine à états pour le comportement de l'IA
enum IaState {
    PATROL,  // Patrouille en cercle autour de la position d'origine
    CHASE,   // Poursuit le joueur visible dans le FOV
    SEARCH,
    ATTACK,// Va à la dernière position connue du joueur
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

    private repathTimeMs = 0;
    private repathEveryMs = 250;

    private roundAngle: number = 0;
    private roundCenter: Vector3 = Vector3.Zero(); // BUG CORRIGÉ : initialisé dans IaToPlayer()

    private lastKnownPlayerPos: Vector3 = Vector3.Zero();

    private originalIaPlacement: Vector3 = Vector3.Zero();

    private readonly arrivalThreshold: number = 1.5;

    private state: IaState = IaState.PATROL;

    public declare entity: DroneEnemy

    private isAiming: boolean = false;
    private lastFireTime: number = 0;

    private conePivot: TransformNode;
    private visionCone: AbstractMesh;
    private visionMat: StandardMaterial;
    private visualObserver: Observer<Scene>;
    private detectionRange: number = 20;
    private fov: number = Math.PI; // 180° par défaut


    constructor(id: string, mesh: AbstractMesh, scene: BaseScene, position?: Vector3) {
        super(id, mesh, scene, position);
    }


    static async CreateAsync(id: string, scene: BaseScene, position: Vector3 = Vector3.Zero()): Promise<IANavigation> {
        const result = await SceneLoader.ImportMeshAsync("", "./models/", "Character.glb", scene);
        const model = result.meshes[0];
        return new IANavigation(id, model, scene, position);
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
        if (!this.GetNavPlugin()) {
            console.error("Navigation plugin not initialized. Call CreateNavMesh() first.");
            return;
        }

        this.targetPlayer = player;

        if (!this.crowd) {
            this.crowd = this.GetNavPlugin().createCrowd(1, 0.5, this.scene);
            this.agentTransform = new TransformNode("agentTransform", this.scene);
            this.agentTransform.position.copyFrom(this.mesh.position);


            this.originalIaPlacement = this.agentTransform.position.clone();

            this.roundCenter = this.originalIaPlacement.clone();

            this.agentId = this.crowd.addAgent(
                this.agentTransform.position,
                this.agentParameters,
                this.agentTransform,
            );

            this.initVisionCone() ;
        }
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
        this.fov = fovRad;

        if (angleBetween > fovRad) return false;

        const ray = new Ray(agentPos, vecPlayer, dist);
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            if (mesh === this.targetPlayer.impostorMesh) return true;
            if (mesh === this.mesh) return false;
            if (mesh.isDescendantOf(this.mesh)) return false;
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
                    const dist = Vector3.Distance(agentPos, this.targetPlayer.impostorMesh.getAbsolutePosition());

                    if (dist <= this.entity.attackRange && this.hasLineOfSight()) {
                        this.state = IaState.ATTACK;
                        this.lastFireTime = performance.now();
                        this.isAiming = true;
                        break;
                    }

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

            case IaState.ATTACK:
                const dist = Vector3.Distance(agentPos, this.targetPlayer.impostorMesh.getAbsolutePosition());

                // Joueur hors portée → retour CHASE
                if (dist > this.entity.attackRange + 2 || !this.hasLineOfSight()) {
                    this.isAiming = false;
                    this.entity.laser.stopAim();
                    this.state = IaState.CHASE;
                    break;
                }

                // Joueur perdu → SEARCH
                if (!playerInFov) {
                    this.state = IaState.SEARCH;
                    break;
                }

                this.updateAttack(deltaMs); // méthode extraite
                break;




            case IaState.RETURN:
                if (playerInFov) {
                    this.state = IaState.CHASE;
                } else {
                    const distToOrigin = Vector3.Distance(agentPos, this.originalIaPlacement);
                    if (distToOrigin < this.arrivalThreshold) {
                        // Retour effectué : reprendre la patrouille circulaire
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



    public GetNavPlugin(): RecastJSPlugin {
        return this.navigationPlugin;
    }

    private hasLineOfSight(): boolean {
        if (!this.entity.target) return false;

        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const direction = targetPos.subtract(myPos).normalize();
        const distance = Vector3.Distance(myPos, targetPos);

        const ray = new Ray(myPos, direction, distance);

        const hit = this.entity.scene.pickWithRay(ray, (m) =>
            m !== this.entity.collider &&
            m !== this.entity.mesh &&
            !m.isDescendantOf(this.entity.mesh) &&
            m.name !== "skyBox" &&
            m.isPickable
        );

        if (hit && hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "CharacterTransform") {
            return false;
        }

        return true;
    }

    private updateAttack(deltaMs: number) {
        if (!this.entity.target) return;

        const deltaSeconds = deltaMs / 1000;

        const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
        this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));

        const myPos = this.entity.collider.getAbsolutePosition();
        const targetPos = this.entity.target.impostorMesh.getAbsolutePosition();
        const desiredDirection = targetPos.subtract(myPos).normalize();

        if (!this.entity.mesh.rotationQuaternion) this.entity.mesh.rotationQuaternion = Quaternion.Identity();
        const targetRotation = Quaternion.FromLookDirectionLH(desiredDirection, Vector3.Up());
        this.entity.mesh.rotationQuaternion = Quaternion.Slerp(this.entity.mesh.rotationQuaternion, targetRotation, 5 * deltaSeconds);

        const currentTime = performance.now();
        const timeAiming = currentTime - this.lastFireTime;
        const progress = Math.min(timeAiming / this.entity.fireCooldown, 1);

        if (this.isAiming) {
            this.entity.laser.aim(myPos, targetPos, progress);
        }

        if (timeAiming > this.entity.fireCooldown && this.isAiming) {
            this.executeFire(myPos, desiredDirection);
            this.lastFireTime = currentTime;
        }
    }


    private executeFire(origin: Vector3, direction: Vector3) {
        const ray = new Ray(origin, direction, this.entity.attackRange + 5);

        const hit = this.entity.scene.pickWithRay(ray, (m) =>
            m !== this.entity.collider &&
            m !== this.entity.mesh &&
            !m.isDescendantOf(this.entity.mesh) &&
            m.name !== "skyBox" &&
            m.isPickable
        );

        const hitDistance = (hit && hit.hit) ? hit.distance : this.entity.attackRange + 5;
        this.entity.laser.fire(origin, direction, hitDistance);

        if (hit && hit.hit && hit.pickedMesh && hit.pickedMesh.name === "CharacterTransform") {

            // On récupère le joueur depuis la scène
            const player = this.entity.scene.actualPlayer;

            if (player) {
                console.log("Le joueur a été touché !");
                player.respawn()
                // Exemple : player.takeDamage(10);
                // Exemple : player.applyKnockback(direction);
            }
        }
    }

    private initVisionCone(): void {


        const fovRatio = this.fov / (Math.PI * 2);

        this.conePivot = new TransformNode(this.entity.id + "_pivot", this.entity.scene);
        this.conePivot.parent = this.entity.mesh;

        this.conePivot.position.y = 0;
        this.conePivot.rotation.x = -0.2;

        this.visionCone = MeshBuilder.CreateDisc(this.entity.id + "_cone", {
            radius: this.detectionRange,
            arc: fovRatio,
            tessellation: 32
        }, this.entity.scene);

        this.visionCone.isPickable = false;
        this.visionCone.parent = this.conePivot;
        this.visionCone.rotation.x = Math.PI / 2;

        this.visionCone.rotation.x = Math.PI / 2;
        this.visionCone.rotation.y = -(this.fov / 2) + Math.PI;

        this.visionMat = new StandardMaterial(this.entity.id + "_coneMat", this.entity.scene);
        this.visionMat.backFaceCulling = false;
        this.visionMat.alpha = 0.2;
        this.visionCone.material = this.visionMat;

        this.visualObserver = this.entity.scene.onBeforeRenderObservable.add(() => {
            if (this.entity.target) {
                this.visionMat.emissiveColor.copyFromFloats(1, 0, 0);
            } else {
                this.visionMat.emissiveColor.copyFromFloats(1, 1, 0);
            }
        });
    }
}