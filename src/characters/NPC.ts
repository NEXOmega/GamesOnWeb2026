import { AbstractMesh, Color3, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, Scene, SceneLoader, TransformNode, Vector3 } from "@babylonjs/core";
import InteractionEntity from "../entities/InteractionEntity";
import Entity from "../entities/Entity";
import Tickable from "../utils/Tickable";
import { StateManager } from "../utils/StateManager";
import * as TitleAnimation from '../gui/title/TitleAnimation'
import BaseScene from "../scenes/BaseScene";
import Player from "./Player";
import Dialogue from "../dialogs/Dialogue";
import DialogueManager from "../dialogs/DialogueManager";
import { AdvancedDynamicTexture, Rectangle, StackPanel, TextBlock } from "@babylonjs/gui";
import { getRotationFromPositions } from "../utils/3DUtils";

export default class NPC extends Entity {

    public readonly collistionMesh: AbstractMesh;
    public readonly model: AbstractMesh;
    readonly physicsAggregate: PhysicsAggregate;
    readonly interaction: InteractionEntity;

    public dialog: Dialogue
    private dialogPane: AbstractMesh;
    
    static async CreateAsync(scene: Scene, position: Vector3 = Vector3.Zero()): Promise<NPC> {
        const result = await SceneLoader.ImportMeshAsync(
            "",
            "./models/",
            "Character.glb",
            scene
        );

        const model = result.meshes[0];

        return new NPC(model, scene, position);
    }

    constructor(mesh: AbstractMesh, scene: Scene, position: Vector3 = Vector3.Zero(), rotation: Vector3 = Vector3.Zero()) {
        super(mesh, scene, Vector3.Zero(), rotation);

        this.collistionMesh = MeshBuilder.CreateCapsule("CharacterTransform", {height: 2, radius: 0.5}, scene);
        this.collistionMesh.visibility = 0.1;
        this.collistionMesh.rotationQuaternion = Quaternion.Identity();
        
        this.model = mesh;
        this.model.parent = this.collistionMesh;

        this.collistionMesh.position = position;
        this.model.position.y = -1;


        this.dialogPane = MeshBuilder.CreatePlane("dialog", {width: 4, height: 3})
        this.dialogPane.parent = this.collistionMesh;
        this.dialogPane.position.y = 1;
        this.dialogPane.position.x = 2;
        this.dialogPane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
        this.dialogPane.visibility = 0

        this.interaction = new InteractionEntity(StateManager.actualPlayer, 5, scene);
        this.interaction.meshEnteredFunc = async (actionEvent) => {
            if(this.interaction.target != StateManager.actualPlayer)
                return;
            const player = this.interaction.target as Player;
            player.playerHud.dialog.enqueueFront({
                text: "Hey !",
                animation: new TitleAnimation.FadeAnimation(1,0,1)
            })
        }

        this.interaction.meshExitedFunc = (actionEvent) => {
            if(this.interaction.target != StateManager.actualPlayer)
                return;
            const player = this.interaction.target as Player;

            this.dialogPane.visibility = 0;
            player.playerHud.dialog.enqueueFront({
                text: "",
                animation: new TitleAnimation.FadeAnimation(1,1,0)
            })
            if(DialogueManager.npc === this) {
                DialogueManager.closeDialogue();
            }
        }
        this.interaction.onInteractFunc = (player, key) => {
            if(DialogueManager.actualDialogue == undefined && DialogueManager.npc == undefined) {
                let cinematicCamera = (this.scene as BaseScene).cinematicCamera;
                cinematicCamera.teleport(player.impostorMesh.position);
                scene.activeCamera = cinematicCamera;
                const targetRot = getRotationFromPositions(this.collistionMesh.position.add(new Vector3(3,2,3)), this.collistionMesh.position.add(new Vector3(0,1.5,0)))
                cinematicCamera.moveTo(player.impostorMesh.position, this.collistionMesh.position.add(new Vector3(3,2,3)), cinematicCamera.rotation, targetRot, 1)

                DialogueManager.startDialogue(player, this, this.dialog);
            } else {
                console.log("Next Dialogue")
                DialogueManager.continueDialogue(player, this, key);
            }
        }

        this.interaction.mesh.parent = this.collistionMesh;

        this.physicsAggregate = new PhysicsAggregate(this.collistionMesh, PhysicsShapeType.CAPSULE, { mass: 1, friction: 0, restitution: 0 }, scene);
    
        this.physicsAggregate.body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
        this.physicsAggregate.body.setAngularDamping(100);
        this.physicsAggregate.body.setLinearDamping(1);
    }

    public updateDialogPanel(dialog: Dialogue) {
            this.dialogPane.getChildren().slice().forEach(child => {
                child.dispose();
            })
            const dialogTexture = AdvancedDynamicTexture.CreateForMesh(this.dialogPane, 1024, 768);

            const verticalPanel = new StackPanel();
            verticalPanel.isVertical = true;
            for(let key in dialog.nextDialogs) {
                const nextDialog: Dialogue = dialog.nextDialogs[key];
                verticalPanel.addControl(this.createDialogOption(key, nextDialog.choiceText));
            }
            dialogTexture.addControl(verticalPanel);

            this.dialogPane.visibility = 1;
    }

    public createDialogOption(key: string, choice: string) {
        const rowPanel = new StackPanel();
        rowPanel.isVertical = false;
        rowPanel.height = '160px';
        rowPanel.paddingBottom = "20px";

        const keyRect = new Rectangle("keyBox")
        keyRect.width = "140px";
        keyRect.height = "140px"; 
        keyRect.background = "rgba(255, 255, 255, 0.8)"; 
        keyRect.cornerRadius = 15; 
        keyRect.color = "white";
        keyRect.thickness = 4;

        const keyText = new TextBlock();
        keyText.text = key.toUpperCase(); 
        keyText.color = "black";
        keyText.fontSize = 80;
        keyText.fontStyle = "bold";
        keyRect.addControl(keyText);

        rowPanel.addControl(keyRect);

        const textRect = new Rectangle("textBox");
        textRect.width = "700px";
        textRect.height = "140px"; 
        textRect.background = "rgba(20, 50, 150, 0.6)";
        textRect.cornerRadius = 20; 
        textRect.color = "cyan";
        textRect.thickness = 4;
        textRect.paddingLeft = "20px"; 

        const textBlock = new TextBlock();
        textBlock.text = choice; 
        textBlock.color = "white";
        textBlock.fontSize = 55; 

        textRect.addControl(textBlock);
        rowPanel.addControl(textRect);

        return rowPanel;
    }
}