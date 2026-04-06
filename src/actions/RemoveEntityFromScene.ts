import Player from "../characters/Player";
import Entity from "../entities/Entity";
import { FadeAnimation } from "../gui/title/TitleAnimation";
import BaseScene from "../scenes/BaseScene";
import { StateManager } from "../utils/StateManager";
import Action from "./Action";

export default class RemoveEntityFromScene extends Action {
    private entity: Entity;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    public execute(player: Player) {
        this.entity.dispose();
    }
}