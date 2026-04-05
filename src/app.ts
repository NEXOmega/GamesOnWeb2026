import BaseScene from './scenes/BaseScene'
import MyScene from './scenes/BasicScene';
import SceneManager from './scenes/SceneManager';
import ItemRegistry from './utils/ItemRegistry';
import SaveManager, { GameSaveData } from './utils/SaveManager';
import { StateManager } from './utils/StateManager';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', async () => {
    
    await ItemRegistry.loadFromJson("items.json")

    SceneManager.init('renderCanvas');

    SceneManager.registerScene("BunkerScene", async () => {
        const firstScene = new MyScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    if(SaveManager.hasSave()) {
        const gameSaveData : GameSaveData = SaveManager.load();
        StateManager.inventory.deserialize(gameSaveData.inventory);
        SceneManager.loadFromSave(gameSaveData);
        console.log("Save chargé depuis le local storage");
        return;
    }
    console.log("Aucune sauvegarde trouvée")
    SceneManager.changeScene("BunkerScene")

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});