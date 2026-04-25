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
    ChangeSceneAction 
} from '../../actions/Action';

export const ALL_ACTIONS: { value: any, name: string }[] = [
    { value: AddItemToInventory, name: "AddItemToInventory" },
    { value: TeleportAction, name: "TeleportAction" },
    { value: CloseDialogueAction, name: "CloseDialogueAction" },
    { value: ClearDialog, name: "ClearDialogue" },
    { value: ConsoleLogAction, name: "ConsoleLogAction" },
    { value: RemoveEntityFromScene, name: "RemoveEntityFromScene" }, // Corrigé !
    { value: RemoveItemFromInventory, name: "RemoveItemFromInventory" },
    { value: StartDialogueAction, name: "StartDialogueAction" },     // Ajouté !
    { value: ChangeSceneAction, name: "ChangeSceneAction" }
];

export const ActionSerializer = new PolymorphicSerializer<Action>(ALL_ACTIONS);