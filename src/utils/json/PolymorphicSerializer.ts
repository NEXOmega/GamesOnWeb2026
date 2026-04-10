import { instanceToPlain, plainToInstance } from 'class-transformer';

// Le format de ton tableau ALL_ANIMATIONS / ALL_ACTIONS
export type TypeRegistry = { value: any, name: string }[];

export class PolymorphicSerializer<T> {
    private registry: TypeRegistry;

    constructor(registry: TypeRegistry) {
        this.registry = registry;
    }

    public serialize(instance: T): string {
        return JSON.stringify(instanceToPlain(instance));
    }

    public deserialize(json: string): T {
        const plainObject = JSON.parse(json);

        // On cherche la classe cible dans le registre fourni
        const matchedType = this.registry.find(sub => sub.name === plainObject.type);

        if (!matchedType) {
            throw new Error(`Type polymorphique inconnu : ${plainObject.type}`);
        }

        // On transforme l'objet simple en vraie instance de classe
        return plainToInstance(matchedType.value, plainObject) as unknown as T;
    }
}