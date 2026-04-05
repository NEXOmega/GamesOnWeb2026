import { Engine } from '@babylonjs/core';
import BaseScene from './scenes/BaseScene'
import MenuScene from './scenes/MenuScene'
import MyScene from './scenes/BasicScene';
import SecondScene from './scenes/SecondScene';
let currentScene: BaseScene;
let engine: Engine;


function switchScene(sceneName: string): void {
    // 1. Nettoyer l'ancienne scène
    if (currentScene) {
        currentScene.disposeScene();
    }

    // 2. Créer la nouvelle
    switch (sceneName) {
        case "menu":
            currentScene = new MenuScene("renderCanvas", engine);
            break;
        case "game":
            currentScene = new MyScene("renderCanvas", engine);
            break;
        case "scene2":
            currentScene = new SecondScene("renderCanvas", engine);
            break;
        default:
            currentScene = new MenuScene("renderCanvas", engine);
    }

    // 3. Brancher le callback de switch
    currentScene.onSwitchScene = switchScene;
}

window.addEventListener('DOMContentLoaded', () => {
    // Créer l'engine une seule fois
    const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    engine = new Engine(canvas, true);

    // Démarrer sur le menu
    switchScene("menu");
});

window.addEventListener('resize', () => {
    engine.resize();
});