import { Condition, HasItemCondition, StateFlagCondition } from '../../condition/Condition';
import { PolymorphicSerializer } from './PolymorphicSerializer';


export const ALL_CONDITIONS: { value: any, name: string }[] = [
    { value: HasItemCondition, name: "HasItemCondition" },
    { value: StateFlagCondition, name: "StateFlagCondition" }
];

export const ConditionSerializer = new PolymorphicSerializer<Condition>(ALL_CONDITIONS);