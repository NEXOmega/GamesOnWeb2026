import 'reflect-metadata';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { TitleAnimation, ALL_ANIMATIONS } from '../../gui/title/TitleAnimation';

export class AnimationSerializer {

    static Serialize(animation: TitleAnimation): string {
        return JSON.stringify(instanceToPlain(animation));
    }

    static Deserialize(json: string): TitleAnimation {
        const plainObject = JSON.parse(json);

        const matchedType = ALL_ANIMATIONS.find(sub => sub.name === plainObject.type);

        if (!matchedType) {
            throw new Error(`Type d'animation inconnu : ${plainObject.type}`);
        }

        return plainToInstance(matchedType.value as any, plainObject) as unknown as TitleAnimation;
    }
}