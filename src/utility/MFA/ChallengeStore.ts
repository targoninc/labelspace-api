export class ChallengeStore {
    private store: string[] = [];

    constructor() {}

    addChallenge(challenge: string) {
        this.store.push(challenge);
    }

    hasChallenge(challenge: string) {
        return this.store.includes(challenge);
    }

    removeChallenge(challenge: string) {
        this.store = this.store.filter(c => c !== challenge);
    }
}