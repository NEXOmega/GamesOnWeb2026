import { PolymorphicSerializer } from './PolymorphicSerializer';
import { 
    Action, 
    AddItemToInventory, 
    TeleportAction, 
    CloseDialogueAction, 
    ClearDialog, 
    ConsoleLogAction, 
    RemoveEntityFromScene, 
    RemoveItemFromInventory, 
    StartDialogueAction, 
    ChangeSceneAction, 
    SetFlagAction
} from '../../actions/Action';

export const ALL_ACTIONS: { value: any, name: string }[] = [
    { value: AddItemToInventory, name: "AddItemToInventory" },
    { value: TeleportAction, name: "TeleportAction" },
    { value: CloseDialogueAction, name: "CloseDialogueAction" },
    { value: ClearDialog, name: "ClearDialogue" },
    { value: ConsoleLogAction, name: "ConsoleLogAction" },
    { value: RemoveEntityFromScene, name: "RemoveEntityFromScene" },
    { value: RemoveItemFromInventory, name: "RemoveItemFromInventory" },
    { value: StartDialogueAction, name: "StartDialogueAction" }, 
    { value: ChangeSceneAction, name: "ChangeSceneAction" },
    { value: SetFlagAction, name: "SetFlagAction"}
];

export const ActionSerializer = new PolymorphicSerializer<Action>(ALL_ACTIONS);