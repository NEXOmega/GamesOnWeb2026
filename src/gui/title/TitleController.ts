import { AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui";
import * as TitleAnimation from "./TitleAnimation";
import TitleRequest from "./TitleRequest";

export class TitleController {
    private text: TextBlock = new TextBlock();

    private queue: TitleRequest[] = [];
    private current: TitleRequest | null = null;

    constructor(ui: AdvancedDynamicTexture) {
        this.text.alpha = 0;
        ui.addControl(this.text);
    }

    enqueue(request: TitleRequest) {
        this.queue.push(request);
    }

    enqueueFront(request: TitleRequest) {
        this.queue.unshift(request);
    }

    
    skipCurrent() {
        this.current = null;
    }


    clearQueue() {
        this.queue = [];
    }

    update() {
        const now = Date.now();

        if (!this.current && this.queue.length > 0) {
            this.current = this.queue.shift()!;

            this.text.text = this.current.text;
            this.current.animation.start(now);
        }

        if (this.current) {
            this.current.animation.update(now, this.text);

            if (this.current.animation.isFinished(now)) {
                this.current = null;
            }
        }
    }

    createFadeTitle(
        text: string,
        fadeIn = 300,
        stay = 2000,
        fadeOut = 300
    ): TitleRequest {

        return {
            text,
            animation: new TitleAnimation.AnimationSequence([
                new TitleAnimation.FadeAnimation(fadeIn, 0, 1),
                new TitleAnimation.WaitAnimation(stay),
                new TitleAnimation.FadeAnimation(fadeOut, 1, 0)
            ])
        };
    }

}
