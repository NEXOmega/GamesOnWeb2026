import { AbstractSound, AudioEngineV2, Camera, CreateAudioEngineAsync, CreateSoundAsync } from "@babylonjs/core";

export default class SoundManager {
    public static audioEngine: AudioEngineV2 | null = null;
    

    public static async initAudio() {
        this.audioEngine = await CreateAudioEngineAsync() as AudioEngineV2;
        
        const savedVolume = localStorage.getItem("game_volume");
        if (savedVolume !== null && this.audioEngine) {
            this.setGlobalVolume(parseFloat(savedVolume));
        }
    }

    // --- NOUVEAU : Gestion du volume ---
    public static setGlobalVolume(volume: number) {
        if (this.audioEngine) {
            this.audioEngine.setVolume(volume);
            localStorage.setItem("game_volume", volume.toString());
        }
    }

    public static getGlobalVolume(): number {
        return this.audioEngine ? this.audioEngine.volume : 1;
    }

    public static setListenerToCamera(camera: Camera) {
        if (this.audioEngine && this.audioEngine.listener) {
            this.audioEngine.listener.attach(camera);
        }
    }

    public static async createSpatialSound(id: string, url: string, maxDistance: number, autoplay : boolean = true, loop : boolean = false): Promise<AbstractSound> {
        return await CreateSoundAsync(id, url, {
            spatialEnabled: true,
            spatialMaxDistance: maxDistance,
            spatialDistanceModel: "exponential",
            autoplay: autoplay,
            loop: loop
        });
    }

    public static async createSound(id: string, url: string, loop : boolean = false): Promise<AbstractSound> {
        return await CreateSoundAsync(id, url, {
            loop: loop
        });
    }
}
