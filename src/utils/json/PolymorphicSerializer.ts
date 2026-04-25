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

    public serializeArray(instances: T[]): string {
        const plainArray = instances.map(instance => instanceToPlain(instance));
        return JSON.stringify(plainArray);
    }

    public deserializeArray(json: string): T[] {
        const plainArray = JSON.parse(json);

        if (!Array.isArray(plainArray)) {
            throw new Error("Le JSON fourni n'est pas un tableau.");
        }

        return plainArray.map(plainObject => this.instantiateSingle(plainObject));
    }

    private instantiateSingle(plainObject: any): T {
        if (!plainObject || !plainObject.type) {
            throw new Error(`Objet invalide ou propriété 'type' manquante : ${JSON.stringify(plainObject)}`);
        }

        const matchedType = this.registry.find(sub => sub.name === plainObject.type);

        if (!matchedType) {
            throw new Error(`Type polymorphique inconnu : ${plainObject.type}`);
        }

        return plainToInstance(matchedType.value, plainObject) as unknown as T;
    }
}