
import Entity from '../entities/Entity';

export default class EntityManager {
    private entities: Entity[] = [];

    public getEntityById(id: string) : Entity {
        const entity : Entity = this.entities.find(entity => entity.id === id)
        if(entity)
            return entity;
        else
            throw new Error("No entity found to dispose. Is it registered ?")
    }

    public addEntity(entity: Entity): void {
        this.entities.push(entity);
    }

    public removeEntity(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    public update(delta: number): void {
        for (const entity of this.entities) {
            entity.update(delta);
        }
    }

    public clear(): void {
        for (const entity of this.entities) {
            entity.dispose();
        }
        this.entities = [];
    }

}