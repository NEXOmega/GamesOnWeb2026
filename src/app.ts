import 'reflect-metadata';
import BaseScene from './scenes/BaseScene'
import DebugScene from './scenes/DebugScene';
import SceneManager from './scenes/SceneManager';
import ItemRegistry from './items/ItemRegistry';
import SaveManager, { GameSaveData } from './utils/SaveManager';
import { StateManager } from './utils/StateManager';
import DialogueManager from './dialogs/DialogueManager';
import Dust2Scene from './scenes/Dust2Scene';
import { CreateAudioEngineAsync } from '@babylonjs/core/AudioV2';
import SoundManager from './sounds/SoundManager';
import MainMenuScene from './scenes/MainMenuScene';
import BunkerScene from './scenes/BunkerScene';
import FirstLevel from './scenes/FirstLevel';
import SecondLevel from './scenes/SecondLevel';

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

    SceneManager.registerScene("Dust2", async () => {
        const firstScene = new Dust2Scene(SceneManager.engine, 'renderCanvas');
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