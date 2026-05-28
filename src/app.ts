import 'reflect-metadata';

import DialogueManager from './dialogs/DialogueManager';
import ItemRegistry from './items/ItemRegistry';
import BaseScene from './scenes/BaseScene'
import BunkerScene from './scenes/BunkerScene';
import DebugScene from './scenes/DebugScene';
import EndingScene from './scenes/EndingScene';
import FirstLevel from './scenes/FirstLevel';
import MainMenuScene from './scenes/MainMenuScene';
import SceneManager from './scenes/SceneManager';
import SecondLevel from './scenes/SecondLevel';
import StoryDebugScene from './scenes/StoryDebug';
import SoundManager from './sounds/SoundManager';
import SaveManager, { GameSaveData } from './utils/SaveManager';
import { StateManager } from './utils/StateManager';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', async () => {
    
    await ItemRegistry.loadFromJson("items.json")
    await DialogueManager.loadAll();

    SceneManager.init('renderCanvas');
    await SoundManager.initAudio()

    SceneManager.registerScene("MainMenu", async () => {
        const scene = new MainMenuScene(SceneManager.engine, 'renderCanvas');
        await scene.initScene();

        return scene;
});

    SceneManager.registerScene("DebugScene", async () => {
        const firstScene = new DebugScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("StoryDebugScene", async () => {
        const firstScene = new StoryDebugScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("BunkerScene", async () => {
        const firstScene = new BunkerScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("FirstLevel", async () => {
        const firstScene = new FirstLevel(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("SecondLevel", async () => {
        const secondScene = new SecondLevel(SceneManager.engine, 'renderCanvas');
        await secondScene.initScene();
        
        return secondScene;
    });

    SceneManager.registerScene("EndingScene", async () => {
        const endingScene = new EndingScene(SceneManager.engine, 'renderCanvas');
        await endingScene.initScene();
        
        return endingScene;
    });

    if(SaveManager.hasSave()) {
        const gameSaveData : GameSaveData = SaveManager.load();
        StateManager.inventory.deserialize(gameSaveData.inventory);
        SceneManager.loadFromSave(gameSaveData);
        console.log("Save chargé depuis le local storage");
        return;
    }

    console.log("Aucune sauvegarde trouvée")
    SceneManager.changeScene("MainMenu")

});

window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});