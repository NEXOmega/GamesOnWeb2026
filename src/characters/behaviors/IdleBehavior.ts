import { Behavior } from "../Behavior";
import DroneEnemy from "../DroneEnemy";

/**
 * Comportement Idle, peut toujorus se lancer, utilisé pour montrer le comportement d'un drone inactif
 */
export default class IdleBehavior extends Behavior {
    
    public declare entity: DroneEnemy;

    constructor(entity: DroneEnemy, priority: number) {
        super(entity, priority);
    }

    public canStart(): boolean {
        return true; 
    }

    public canContinue(): boolean {
        return true;
    }

    public update(delta: number): void {
        const currentVel = this.entity.physicsAggregate.body.getLinearVelocity();
        this.entity.physicsAggregate.body.setLinearVelocity(currentVel.scale(0.9));
    }
}