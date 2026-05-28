import { ALL_ANIMATIONS,TitleAnimation } from '../../gui/title/TitleAnimation';
import { PolymorphicSerializer } from './PolymorphicSerializer';

export const AnimationSerializer = new PolymorphicSerializer<TitleAnimation>(ALL_ANIMATIONS);