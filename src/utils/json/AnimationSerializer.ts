import { PolymorphicSerializer } from './PolymorphicSerializer';
import { TitleAnimation, ALL_ANIMATIONS } from '../../gui/title/TitleAnimation';

export const AnimationSerializer = new PolymorphicSerializer<TitleAnimation>(ALL_ANIMATIONS);