import {server} from '@passwordless-id/webauthn'

export class WebAuthN {
    static generateChallenge() {
        return server.randomChallenge();
    }

    static async verifyChallenge(challenge: string, registration: any) {
        const expected = {
            challenge,
            origin: process.env.WEBAUTHN_ORIGIN,
        };
        return await server.verifyRegistration(registration, expected);
    }
}