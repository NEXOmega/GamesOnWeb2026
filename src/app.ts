import 'reflect-metadata';
import BaseScene from './scenes/BaseScene'
import DebugScene from './scenes/DebugScene';
import SceneManager from './scenes/SceneManager';
import ItemRegistry from './items/ItemRegistry';
import SaveManager, { GameSaveData } from './utils/SaveManager';
import { StateManager } from './utils/StateManager';
import DialogueManager from './dialogs/DialogueManager';
import { CreateAudioEngineAsync } from '@babylonjs/core/AudioV2';
import SoundManager from './sounds/SoundManager';
import MainMenuScene from './scenes/MainMenuScene';
import BunkerScene from './scenes/BunkerScene';
import FirstLevel from './scenes/FirstLevel';
import SecondLevel from './scenes/SecondLevel';
import StoryDebugScene from './scenes/StoryDebug';
import EndingScene from './scenes/EndingScene';

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