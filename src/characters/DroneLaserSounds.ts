import { AbstractMesh, AbstractSound } from "@babylonjs/core";
import SoundManager from "../sounds/SoundManager";

export default class DroneLaserSounds {
    private chargeSound?: AbstractSound;
    private shootSound?: AbstractSound;
    private chargeSoundPromise?: Promise<AbstractSound>;
    private shootSoundPromise?: Promise<AbstractSound>;
    private shouldPlayChargeSound: boolean = false;
    private isDisposed: boolean = false;

    constructor(
        private readonly id: string,
        private readonly collider: AbstractMesh
    ) {}

    public startCharge(): void {
        if (this.isDisposed) return;

        this.shouldPlayChargeSound = true;

        void this.getChargeSound().then((sound) => {
            if (this.isDisposed) {
                sound.dispose();
                return;
            }

            if (!this.shouldPlayChargeSound) {
                sound.stop();
                return;
            }

            sound.stop();
            sound.play();
        });
    }

    public stopCharge(): void {
        this.shouldPlayChargeSound = false;
        this.chargeSound?.stop();
    }

    public playShoot(): void {
        if (this.isDisposed) return;

        this.stopCharge();

        void this.getShootSound().then((sound) => {
            if (this.isDisposed) {
                sound.dispose();
                return;
            }

            sound.stop();
            sound.play();
        });
    }

    public dispose(): void {
        this.isDisposed = true;
        this.stopCharge();
        this.chargeSound?.dispose();
        this.shootSound?.dispose();
    }

    private async getChargeSound(): Promise<AbstractSound> {
        if (!this.chargeSoundPromise) {
            this.chargeSoundPromise = SoundManager.createSpatialSound(
                `${this.id}_laser_charge`,
                "./assets/sounds/drone/laser_charge.mp3",
                35,
                false,
                true
            ).then((sound) => {
                sound.spatial.attach(this.collider);
                this.chargeSound = sound;
                return sound;
            });
        }

        return this.chargeSoundPromise;
    }

    private async getShootSound(): Promise<AbstractSound> {
        if (!this.shootSoundPromise) {
            this.shootSoundPromise = SoundManager.createSpatialSound(
                `${this.id}_laser_shoot`,
                "./assets/sounds/drone/laser_shoot.mp3",
                35,
                false,
                false
            ).then((sound) => {
                sound.spatial.attach(this.collider);
                this.shootSound = sound;
                return sound;
            });
        }

        return this.shootSoundPromise;
    }
}
