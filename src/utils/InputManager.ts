import { KeyboardEventTypes, Observable, Scene } from "@babylonjs/core";

export type InputAction = 
    | "move_forward" 
    | "move_backward" 
    | "move_left" 
    | "move_right" 
    | "jump"
    | "interact" 
    | "open_inventory"
    | "dialog_next" 
    | "dialog_skip";

export default class InputManager {
    private static actionMap: Record<InputAction, string[]> = {
        "move_forward": ["w", "z", "arrowup"],
        "move_backward": ["s", "arrowdown"],
        "move_left": ["a", "q", "arrowleft"],
        "move_right": ["d", "arrowright"],
        "jump": [" "],
        "interact": ["e"],
        "open_inventory": ["i"],
        "dialog_next": ["r", " ", "enter"],
        "dialog_skip": ["escape"]
    };

    private static keysDown: Set<string> = new Set();
    private static keysJustPressed: Set<string> = new Set();

    private static actionsDown: Set<InputAction> = new Set();
    private static actionsJustPressed: Set<InputAction> = new Set();

    public static onAnyKeyPressed: Observable<string> = new Observable();

    public static onActionJustPressed: Observable<InputAction> = new Observable();
    public static onActionJustReleased: Observable<InputAction> = new Observable();

    public static init(scene: Scene) {
        scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();

            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                if (!this.keysDown.has(key)) {
                    this.keysDown.add(key);
                    this.keysJustPressed.add(key);
                    
                    this.updateActions(key, true);

                    this.onAnyKeyPressed.notifyObservers(key);
                }
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this.keysDown.delete(key);
                this.updateActions(key, false);
            }
        });
    }

    private static updateActions(key: string, isPressed: boolean) {
        for (const [action, keys] of Object.entries(this.actionMap)) {
            const inputAction = action as InputAction;
            
            if (keys.includes(key)) {
                if (isPressed) {
                    if (!this.actionsDown.has(inputAction)) {
                        this.actionsDown.add(inputAction);
                        this.actionsJustPressed.add(inputAction);
                        this.onActionJustPressed.notifyObservers(inputAction); 
                    }
                } else {
                    const isAnyKeyStillDown = keys.some(k => this.keysDown.has(k));
                    if (!isAnyKeyStillDown) {
                        this.actionsDown.delete(inputAction);
                        this.onActionJustReleased.notifyObservers(inputAction); 
                    }
                }
            }
        }
    }
    
    public static isActionPressed(action: InputAction): boolean {
        return this.actionsDown.has(action);
    }

    public static isActionJustPressed(action: InputAction): boolean {
        return this.actionsJustPressed.has(action);
    }

    public static getKeysJustPressed(): string[] {
        return Array.from(this.keysJustPressed);
    }

    public static clearJustPressed() {
        this.actionsJustPressed.clear();
        this.keysJustPressed.clear();
    }
}