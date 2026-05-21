// UsableItem.ts
import Player from "../characters/Player";

export interface UsableItem {
    itemId: string;
    use(player: Player): void;
}