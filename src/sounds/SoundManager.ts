import { AbstractSound, AudioEngineV2, Camera, CreateAudioEngineAsync, CreateSoundAsync } from "@babylonjs/core";

export default class SoundManager {
    public static audioEngine: AudioEngineV2 | null = null;
    

    public static async initAudio() {
        this.audioEngine = await CreateAudioEngineAsync();
    
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
