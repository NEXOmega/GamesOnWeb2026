import BaseScene from './scenes/BaseScene'
import MyScene from './scenes/BasicScene';

let game: BaseScene;

window.addEventListener('DOMContentLoaded', () => {
    // Create the game using the 'renderCanvas'.
    game = new MyScene('renderCanvas');
  });

window.addEventListener('resize', () => {
    game.engine.resize();
});