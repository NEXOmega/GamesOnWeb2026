import 'reflect-metadata';
import BaseScene from './scenes/BaseScene'
import DebugScene from './scenes/DebugScene';
import SceneManager from './scenes/SceneManager';
import ItemRegistry from './utils/ItemRegistry';
import SaveManager, { GameSaveData } from './utils/SaveManager';
import { StateManager } from './utils/StateManager';
import DialogueManager from './dialogs/DialogueManager';
import Dust2Scene from './scenes/Dust2Scene';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', async () => {
    
    await ItemRegistry.loadFromJson("items.json")
    await DialogueManager.loadAll();

    SceneManager.init('renderCanvas');

    SceneManager.registerScene("BunkerScene", async () => {
        const firstScene = new DebugScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("Dust2", async () => {
        const firstScene = new Dust2Scene(SceneManager.engine, 'renderCanvas');
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
    SceneManager.changeScene("Dust2")

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});