import { Action, ALL_ACTIONS } from '../../actions/Action';
import { PolymorphicSerializer } from './PolymorphicSerializer';

export const ActionSerializer = new PolymorphicSerializer<Action>(ALL_ACTIONS);