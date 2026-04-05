import { Engine } from '@babylonjs/core';
import BaseScene from './scenes/BaseScene'
import MenuScene from './scenes/MenuScene'
import MyScene from './scenes/BasicScene';
import SceneManager from './scenes/SceneManager';
import SaveManager from './utils/SaveManager';
import SecondScene from './scenes/SecondScene';

window.addEventListener('DOMContentLoaded', () => {
    
    SceneManager.init('renderCanvas');

    SceneManager.registerScene("game", async () => {
        const firstScene = new MyScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    SceneManager.registerScene("bunker", async () => {
        const secondScene = new SecondScene(SceneManager.engine, 'renderCanvas');
        await secondScene.initScene();
        
        return secondScene;
    });

    SceneManager.registerScene("menu", async () => {
        const menuScene = new MenuScene(SceneManager.engine, 'renderCanvas');
        await menuScene.initScene();
        
        return menuScene;
    });

    console.log("Aucune sauvegarde trouvée")
    SceneManager.changeScene("menu")

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});