import { AdvancedDynamicTexture, Rectangle, StackPanel, ScrollViewer, TextBlock, Image, Control, Grid } from "@babylonjs/gui";
import { Scene } from "@babylonjs/core";
import Inventory from "../../player/inventory/Inventory";
import { Item } from "../../player/inventory/Item";
import { State, StateManager } from "../../utils/StateManager";
import ItemRegistry from "../../utils/ItemRegistry";

export default class InventoryUI {
    private texture: AdvancedDynamicTexture;
    private mainContainer: Rectangle;
    private listPanel: StackPanel;
    private detailsPanel: StackPanel;
    private inventory: Inventory;
    private scene: Scene;

    constructor(inventory: Inventory, scene: Scene) {
        this.inventory = inventory;
        this.scene = scene;
        
        this.texture = AdvancedDynamicTexture.CreateFullscreenUI("InventoryUI");

        this.mainContainer = new Rectangle("InventoryContainer");
        this.mainContainer.width = "100%";
        this.mainContainer.height = "100%";
        this.mainContainer.background = "rgba(0, 0, 0, 0.7)";
        this.mainContainer.thickness = 0;
        this.mainContainer.isVisible = false;
        this.texture.addControl(this.mainContainer);

        const layoutGrid = new Grid();
        layoutGrid.addColumnDefinition(0.4); // 40% largeur
        layoutGrid.addColumnDefinition(0.6); // 60% largeur
        this.mainContainer.addControl(layoutGrid);

        const scrollViewer = new ScrollViewer();
        scrollViewer.width = "80%";
        scrollViewer.height = "80%";
        scrollViewer.thickness = 0;
        scrollViewer.barColor = "white";
        layoutGrid.addControl(scrollViewer, 0, 0);

        this.listPanel = new StackPanel();
        this.listPanel.isVertical = true;
        scrollViewer.addControl(this.listPanel);

        this.detailsPanel = new StackPanel();
        this.detailsPanel.isVertical = true;
        this.detailsPanel.width = "80%";
        this.detailsPanel.height = "80%";
        layoutGrid.addControl(this.detailsPanel, 0, 1);

        this.inventory.onInventoryChanged.add(() => {
            this.renderList();
        });

        this.renderList();
    }

    public toggle() {
        this.mainContainer.isVisible = !this.mainContainer.isVisible;
        
        const canvas = this.scene.getEngine().getRenderingCanvas();
        console.log(this.inventory.items.size)
        if (this.mainContainer.isVisible) {
            document.exitPointerLock();
            StateManager.state = State.IN_INVENTORY;
        } else {
            if (canvas) {
                canvas.requestPointerLock();
                StateManager.state = State.PLAYING
            }
        }
    }

    private renderList() {
        this.listPanel.children.slice().forEach(child => child.dispose());

        this.inventory.items.forEach((value, key) => {
            const btn = this.createListItem(ItemRegistry.getItem(key), value);
            this.listPanel.addControl(btn);
        });
    }

    private createListItem(item: Item, quantity: number): Rectangle {
        const btn = new Rectangle(`btn_${item.id}`);
        btn.height = "60px";
        btn.width = "100%";
        btn.background = "rgba(40, 40, 40, 0.8)";
        btn.color = "gray"; // Bordure
        btn.thickness = 1;
        btn.hoverCursor = "pointer";
        btn.paddingBottom = "5px";

        btn.onPointerEnterObservable.add(() => { btn.background = "rgba(80, 80, 80, 0.9)"; });
        btn.onPointerOutObservable.add(() => { btn.background = "rgba(40, 40, 40, 0.8)"; });

        btn.onPointerClickObservable.add(() => {
            this.showItemDetails(item);
        });

        const text = new TextBlock();
        text.text = `${item.name} (x${quantity})`;
        text.color = "white";
        text.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        text.paddingLeft = "20px";
        text.fontSize = 24;

        btn.addControl(text);
        return btn;
    }

    private showItemDetails(item: Item) {
        this.detailsPanel.children.slice().forEach(child => child.dispose());

        const icon = new Image("detailIcon", item.iconUrl);
        icon.width = "200px";
        icon.height = "200px";
        icon.stretch = Image.STRETCH_UNIFORM;
        icon.paddingBottom = "20px";
        this.detailsPanel.addControl(icon);

        const nameText = new TextBlock();
        nameText.text = item.name.toUpperCase();
        nameText.color = "gold";
        nameText.height = "50px";
        nameText.fontSize = 36;
        nameText.fontStyle = "bold";
        this.detailsPanel.addControl(nameText);

        const descText = new TextBlock();
        descText.text = item.description;
        descText.color = "white";
        descText.textWrapping = true; // Permet de revenir à la ligne
        descText.height = "200px";
        descText.fontSize = 20;
        descText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this.detailsPanel.addControl(descText);
    }
}