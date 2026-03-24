import BaseScene from './scenes/BaseScene'
import MyScene from './scenes/BasicScene';
import SceneManager from './scenes/SceneManager';
import SaveManager from './utils/SaveManager';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', () => {
    
    SceneManager.init('renderCanvas');

    SceneManager.registerScene("BunkerScene", async () => {
        const firstScene = new MyScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

    if(SaveManager.hasSave()) {
        SceneManager.loadFromSave(SaveManager.load());
        console.log("Save chargé depuis le local storage")
        return;
    }
    console.log("Aucune sauvegarde trouvée")
    SceneManager.changeScene("BunkerScene")

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});