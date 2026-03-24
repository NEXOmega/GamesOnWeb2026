export interface GameSaveData {
    sceneId: string;
    playerPosition: { x: number, y: number, z: number };
}

export default class SaveManager {
    private static readonly SAVE_KEY = "saloon_save";

    public static hasSave(): boolean {
        return !!localStorage.getItem(this.SAVE_KEY);
    }

    public static save(data: GameSaveData): void {
        try {
            const jsonString = JSON.stringify(data);
            const base64String = btoa(jsonString);
            
            localStorage.setItem(this.SAVE_KEY, base64String);
            
            console.log("Jeu sauvegardé avec succès !");
        } catch (error) {
            console.error("Erreur lors de la sauvegarde :", error);
        }
    }

    public static load(): GameSaveData | null {
        try {
            const base64String = localStorage.getItem(this.SAVE_KEY);
            if (!base64String) {
                return null; 
            }

            const jsonString = atob(base64String);
            
            const data = JSON.parse(jsonString) as GameSaveData;
            
            console.log("Sauvegarde chargée !");
            return data;

        } catch (error) {
            console.error("Fichier de sauvegarde corrompu ou illisible :", error);
            return null;
        }
    }

    public static clearSave(): void {
        localStorage.removeItem(this.SAVE_KEY);
        console.log("Sauvegarde effacée.");
    }
}