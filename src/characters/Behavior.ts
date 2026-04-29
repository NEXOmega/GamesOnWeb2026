import Entity from "../entities/Entity";

export abstract class Behavior {
    public entity: Entity;
    public priority: number;

    /**
     * @param entity L'entité qui possède ce comportement
     * @param priority Priorité utilisée pour savoir quel comportements faire en premier (0 = Plus haute priorité, 10 = Basse priorité)
     */
    constructor(entity: Entity, priority: number) {
        this.entity = entity;
        this.priority = priority;
    }

    /**
     * Utilisé pour savoir si le comportement peut commencer, si il ne peut pas un autre behavior sera utilisé et stop() sera appelé
     */
    public abstract canStart(): boolean;

    /**
     * Pareil qu'au dessus mais pour savoir si il peut continuer, si il ne peut pas il sera arrété et stop() sera appelé
     */
    public abstract canContinue(): boolean;

    /**
     * Appelé au commencement du comportement si celui-ci a passé le canStart
     */
    public start(): void {}

    /**
     * Appelé a chaque frame tant que canContinue() = true
     * @param delta le temps passé depuis la dernière frame
     */
    public abstract update(delta: number): void;

    /**
     * Appelé quand le comportement est interrompu (par un comportement plus prioritaire) ou fini
     */
    public stop(): void {}
}