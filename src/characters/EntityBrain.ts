// Dans un nouveau fichier EntityBrain.ts
import { Behavior } from "./Behavior";

export default class EntityBrain {
    private behaviors: Behavior[] = [];
    private activeBehavior: Behavior | null = null;

    /**
     * Ajoute un comportement et trie notre liste pour pouvoir garder l'ordre de nos priorité
     * @param behavior Le comportement a ajouter a notre Cerveau
     */
    public addBehavior(behavior: Behavior): void {
        this.behaviors.push(behavior);
        this.behaviors.sort((a, b) => a.priority - b.priority);
    }

    /**
     * Fonction appelée a chaque frame, permet de lancer le comportement adéquat selon les prioritée et les conditions
     * @param delta Le temps passé par rapport a la dernière frame
     */
    public update(delta: number): void {
        let bestBehavior: Behavior | null = null;

        for (const behavior of this.behaviors) {
            if (behavior === this.activeBehavior) {
                if (behavior.canContinue()) {
                    bestBehavior = behavior;
                    break; 
                }
            } 
            else if (behavior.canStart()) {
                bestBehavior = behavior;
                break;
            }
        }

        if (this.activeBehavior !== bestBehavior) {
            if (this.activeBehavior) {
                this.activeBehavior.stop();
            }
            this.activeBehavior = bestBehavior;
            if (this.activeBehavior) {
                this.activeBehavior.start();
            }
        }

        if (this.activeBehavior) {
            this.activeBehavior.update(delta);
        }
    }
}