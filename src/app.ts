import BaseScene from './scenes/BaseScene'
import MyScene from './scenes/BasicScene';
import SceneManager from './scenes/SceneManager';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', () => {
    
    SceneManager.init('renderCanvas');

    SceneManager.changeScene("initial_scene", async () => {
        const firstScene = new MyScene(SceneManager.engine, 'renderCanvas');
        await firstScene.initScene();
        
        return firstScene;
    });

});
window.addEventListener('resize', () => {
    SceneManager.engine.resize();
});