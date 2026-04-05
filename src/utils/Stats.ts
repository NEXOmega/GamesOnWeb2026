
export class Stats {
    private morale: number = 50;
    private ethique: number = 50;

    public getMorale(): number {
        return this.morale;
    }

    public addMorale(amount: number) {
        this.morale = this.clamp(this.morale + amount, 0, 100);
    }

    public getEthique(): number {
        return this.ethique;
    }

    public addEthique(amount: number) {
        this.morale = this.clamp(this.morale + amount, 0, 100);
    }

    clamp(number: number, lower: number, upper: number) {
        return Math.min(Math.max(number, lower), upper);
    }
}
