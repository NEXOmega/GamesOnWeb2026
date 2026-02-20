// TitleAnimation.ts
import 'reflect-metadata';
import { Type, Expose } from 'class-transformer';
import { TextBlock } from "@babylonjs/gui";

export const ALL_ANIMATIONS: { value: any, name: string }[] = [];

export interface TitleAnimation {
    type: string;
    startTime: number;
    duration: number;
    start(now: number): void;
    update(now: number, text: TextBlock): void;
    isFinished(now: number): boolean;
}

export class AnimationGroup implements TitleAnimation {
    readonly type = "AnimationGroup";
    
    @Expose() // Important : on veut sauvegarder startTime si on save en cours de route ? Sinon @Exclude()
    startTime = 0;
    
    @Expose()
    duration: number;

    // MAGIE ICI : On dit que ce tableau contient des objets polymorphiques
    @Type(() => Object, {
        discriminator: {
            property: 'type',
            subTypes: ALL_ANIMATIONS
        }
    })
    @Expose()
    public animations: TitleAnimation[];

    constructor(animations: TitleAnimation[] = []) { // Valeur par défaut pour le constructeur vide
        this.animations = animations;
        this.duration = animations.length > 0 ? Math.max(...animations.map(a => a.duration)) : 0;
    }

    start(now: number) {
        this.startTime = now;
        for (const a of this.animations) a.start(now);
    }

    update(now: number, text: TextBlock) {
        for (const a of this.animations) a.update(now, text);
    }

    isFinished(now: number) {
        return this.animations.every(a => a.isFinished(now));
    }
}

export class FadeAnimation implements TitleAnimation {
    readonly type = "FadeAnimation";
    startTime = 0;

    @Expose()
    public duration: number;
    @Expose()
    private from: number;
    @Expose()
    private to: number;


    constructor(duration: number = 1, from: number = 0, to: number = 1) {
        this.duration = duration;
        this.from = from;
        this.to = to;
    }

    start(now: number) { this.startTime = now; }

    update(now: number, text: TextBlock) {
        const t = Math.min(1, (now - this.startTime) / this.duration);
        const alpha = this.from + (this.to - this.from) * t;
        text.alpha = Math.max(0, Math.min(1, alpha));
    }

    isFinished(now: number) { return now >= this.startTime + this.duration; }
}

export class TypewriterAnimation implements TitleAnimation {
    readonly type = "TypewriterAnimation";
    startTime = 0;

    @Expose() // On doit exposer ceci pour le sauvegarder
    private fullText: string;
    @Expose()
    public duration: number;


    constructor(text: string = "", duration: number = 1) {
        this.fullText = text;
        this.duration = duration;
    }

    start(now: number) { this.startTime = now; }

    update(now: number, text: TextBlock) {
        const t = Math.min(1, (now - this.startTime) / this.duration);
        const length = Math.floor(this.fullText.length * t);
        text.text = this.fullText.substring(0, length);
    }

    isFinished(now: number) { return now >= this.startTime + this.duration; }
}

export class AnimationSequence implements TitleAnimation {
    readonly type = "AnimationSequence";
    startTime = 0;
    duration: number;
    private index = 0;

    // Pareil que pour AnimationGroup : Polymorphisme récursif
    @Type(() => Object, {
        discriminator: {
            property: 'type',
            subTypes: ALL_ANIMATIONS
        }
    })
    @Expose()
    public animations: TitleAnimation[];

    constructor(animations: TitleAnimation[] = []) {
        this.animations = animations;
        this.duration = animations.reduce((sum, a) => sum + a.duration, 0);
    }

    start(now: number) {
        this.startTime = now;
        this.index = 0;
        if(this.animations.length > 0) this.animations[0].start(now);
    }

    update(now: number, text: TextBlock) {
        if (this.index >= this.animations.length) return;
        const current = this.animations[this.index];
        current.update(now, text);
        if (current.isFinished(now)) {
            this.index++;
            if (this.index < this.animations.length) {
                this.animations[this.index].start(now);
            }
        }
    }

    isFinished() { return this.index >= this.animations.length; }
}

export class WaitAnimation implements TitleAnimation {
    readonly type = "WaitAnimation";
    startTime = 0;

    @Expose()
    public duration: number;

    constructor(duration: number = 0) {
        this.duration = duration;
    }
    start(now: number) { this.startTime = now; }
    update() {}
    isFinished(now: number) { return now >= this.startTime + this.duration; }
}

export class SetTextInfoAnimation implements TitleAnimation {
    readonly type = "SetTextInfoAnimation";
    startTime = 0;

    @Expose()
    public alpha: number;
    @Expose()
    public color: string;
    @Expose()
    public fontSize: number;
    @Expose()
    public duration: number;

    constructor(alpha: number = 1,color: string = "white", fontSize: number = 30, duration: number = 0) {
        this.alpha = alpha;
        this.color = color;
        this.fontSize = fontSize;
        this.duration = duration
    }

    start(now: number) { this.startTime = now; }
    update(now: number, text: TextBlock) {
        text.fontSize = this.fontSize;
        text.color = this.color;
        text.alpha = this.alpha;
    }
    isFinished(now: number) { return now >= this.startTime + this.duration; }
}


ALL_ANIMATIONS.push({ value: AnimationGroup, name: "AnimationGroup" });
ALL_ANIMATIONS.push({ value: FadeAnimation, name: "FadeAnimation" });
ALL_ANIMATIONS.push({ value: TypewriterAnimation, name: "TypewriterAnimation" });
ALL_ANIMATIONS.push({ value: AnimationSequence, name: "AnimationSequence" });
ALL_ANIMATIONS.push({ value: WaitAnimation, name: "WaitAnimation" });
ALL_ANIMATIONS.push({ value: SetTextInfoAnimation, name: "SetTextInfoAnimation" });