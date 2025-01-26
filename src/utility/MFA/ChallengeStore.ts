import {Challenge} from "./Challenge.ts";

export class ChallengeStore {
    private store: Challenge[] = [];

    constructor() {
        setInterval(() => {
            for (const challenge of this.store) {
                if (challenge.expires_at < new Date()) {
                    this.removeChallenge(challenge.challenge);
                }
            }
        }, 1000 * 60);
    }

    addChallenge(challenge: string) {
        this.store.push({
            challenge,
            created_at: new Date(),
            expires_at: new Date(new Date().getTime() + 1000 * 60 * 5),
            completed: false
        });
    }

    hasUncompletedChallenge(challenge: string) {
        return this.store.some(c => c.challenge === challenge && !c.completed);
    }

    removeChallenge(challenge: string) {
        this.store = this.store.filter(c => c.challenge !== challenge);
    }

    completeChallenge(challenge: string) {
        const challenges = this.store.filter(c => c.challenge === challenge);
        for (const c of challenges) {
            c.completed = true;
        }
    }

    hasCompletedChallenge(challenge: string | undefined) {
        return challenge === undefined || this.store.some(c => c.challenge === challenge && c.completed);
    }
}