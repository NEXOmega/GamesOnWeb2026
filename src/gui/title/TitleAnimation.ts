import { TextBlock } from "@babylonjs/gui";

export interface TitleAnimation {
    startTime: number;
    duration: number;

    start(now: number): void;
    update(now: number, text: TextBlock): void;
    isFinished(now: number): boolean;
}

export class AnimationGroup implements TitleAnimation {
    startTime = 0;
    duration: number;

    constructor(private animations: TitleAnimation[]) {
        this.duration = Math.max(...animations.map(a => a.duration));
    }

    start(now: number) {
        this.startTime = now;
        for (const a of this.animations) {
            a.start(now);
        }
    }

    update(now: number, text: TextBlock) {
        for (const a of this.animations) {
            a.update(now, text);
        }
    }

    isFinished(now: number) {
        return this.animations.every(a => a.isFinished(now));
    }
}

export class FadeAnimation implements TitleAnimation {
    startTime = 0;

    constructor(
        public duration: number,
        private from: number,
        private to: number
    ) {}

    start(now: number) {
        this.startTime = now;
    }

    update(now: number, text: TextBlock) {
        const t = Math.min(1, (now - this.startTime) / this.duration);
        const alpha = this.from + (this.to - this.from) * t;
        text.alpha = Math.max(0, Math.min(1, alpha));
    }

    isFinished(now: number) {
        return now >= this.startTime + this.duration;
    }
}

export class TypewriterAnimation implements TitleAnimation {
    startTime = 0;
    private fullText: string;

    constructor(text: string, public duration: number) {
        this.fullText = text;
    }

    start(now: number) {
        this.startTime = now;
    }

    update(now: number, text: TextBlock) {
        const t = Math.min(1, (now - this.startTime) / this.duration);
        const length = Math.floor(this.fullText.length * t);
        text.text = this.fullText.substring(0, length);
    }

    isFinished(now: number) {
        return now >= this.startTime + this.duration;
    }
}

export class AnimationSequence implements TitleAnimation {
    startTime = 0;
    duration: number;

    private index = 0;

    constructor(private animations: TitleAnimation[]) {
        this.duration = animations.reduce((sum, a) => sum + a.duration, 0);
    }

    start(now: number) {
        this.startTime = now;
        this.index = 0;
        this.animations[0].start(now);
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

    isFinished() {
        return this.index >= this.animations.length;
    }
}

export class WaitAnimation implements TitleAnimation {
    startTime = 0;

    constructor(public duration: number) {}

    start(now: number) {
        this.startTime = now;
    }

    update() {}

    isFinished(now: number) {
        return now >= this.startTime + this.duration;
    }
}

export class SetTextInfoAnimation implements TitleAnimation {
    startTime = 0;

    constructor(public alpha: number = 1, public color: string = "white", public fontSize: number = 30, public duration: number) {}

    start(now: number) { 
        this.startTime = now;
    }

    update(now: number, text: TextBlock) {
        text.fontSize = this.fontSize;
        text.color = this.color;
        text.alpha = this.alpha;
    }

    isFinished(now: number) {
        return now >= this.startTime + this.duration;
    }
}

