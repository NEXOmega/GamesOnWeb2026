import { Scene, HemisphericLight, Vector3, MeshBuilder, HavokPlugin, PhysicsAggregate, PhysicsShapeType, ExecuteCodeAction, ActionManager, Color3, CubeTexture, StandardMaterial, Texture, DirectionalLight, ShadowGenerator, CascadedShadowGenerator } from '@babylonjs/core';
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from "@babylonjs/havok";

import BaseScene from './BaseScene';
import CinematicCamera from '../camera/CinematicCamera';
import Player from '../characters/Player';
import CollisionEntity from '../entities/CollisionEntity';
import { State, StateManager } from '../utils/StateManager';
import InteractionEntity from '../entities/InteractionEntity';
import * as TitleAnimation from '../gui/title/TitleAnimation'
import { AnimationSerializer } from '../utils/json/AnimationSerializer';
import NPC from '../characters/NPC';
import Dialogue from '../dialogs/Dialogue';
import SceneManager from './SceneManager';
import SaveManager from '../utils/SaveManager';
import ItemRegistry from '../items/ItemRegistry';
import Pickable from '../entities/Pickable';
import { ConsoleLogAction, TeleportAction } from '../actions/Action';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { SkyMaterial } from '@babylonjs/materials';
import { loadConfig } from './SceneUtils';
import IANavigation from "../characters/IANavigation";

export default class Dust2Scene extends BaseScene {

    async createEnvironment(): Promise<void> {

        await loadConfig("./assets/models/dust2.json", this);
        ;
    }
}
