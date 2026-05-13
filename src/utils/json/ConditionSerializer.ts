import { Condition, FlagStateCondition, HasItemCondition } from '../../condition/Condition';
import { PolymorphicSerializer } from './PolymorphicSerializer';


export const ALL_CONDITIONS: { value: any, name: string }[] = [
    { value: HasItemCondition, name: "HasItemCondition" },
    { value: FlagStateCondition, name: "FlagStateCondition"}
];

export const ConditionSerializer = new PolymorphicSerializer<Condition>(ALL_CONDITIONS);