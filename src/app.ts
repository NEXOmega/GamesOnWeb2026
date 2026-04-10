import { Engine } from '@babylonjs/core';
import BaseScene from './scenes/BaseScene'
import MenuScene from './scenes/MenuScene'
import MyScene from './scenes/BasicScene';
import SceneManager from './scenes/SceneManager';
import SaveManager from './utils/SaveManager';
<<<<<<< HEAD
import SecondScene from './scenes/SecondScene';
=======

let game: BaseScene;
>>>>>>> a8089a1f7fee56ed910fcd0e811004416955e2a5

window.addEventListener('DOMContentLoaded', () => {
    
    SceneManager.init('renderCanvas');

<<<<<<<             
    SceneManager.registerScene("game", async () => {
=======
    SceneManager.registerScene("BunkerScene", async () => {
>>>>>>> a8089a1f7fee56ed910fcd0e811004416955e2a5
        const firstScene = new MyScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

<<<<<<< HEAD
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
=======
    if(SaveManager.hasSave()) {
        SceneManager.loadFromSave(SaveManager.load());
        console.log("Save chargé depuis le local storage")
        return;
    }
    console.log("Aucune sauvegarde trouvée")
    SceneManager.changeScene("BunkerScene")
>>>>>>> a8089a1f7fee56ed910fcd0e811004416955e2a5

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});