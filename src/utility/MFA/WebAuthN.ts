import {server} from '@passwordless-id/webauthn'
import {PublicKey} from "../../models/db/tri/PublicKey.ts";
import {
    AuthenticationJSON,
    CredentialInfo,
    ExtendedAuthenticatorTransport, NamedAlgo
} from "@passwordless-id/webauthn/dist/esm/types";

export class WebAuthN {
    static generateChallenge() {
        return server.randomChallenge();
    }

    static async verifyRegistration(challenge: string, registration: any) {
        const expected = {
            challenge,
            origin: process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3002",
        };
        return await server.verifyRegistration(registration, expected);
    }

    static async verifyChallenge(challenge: string, verification: AuthenticationJSON, publicKey: PublicKey) {
        const expected = {
            challenge,
            origin: process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3002",
            userVerified: true
        };
        const credential: CredentialInfo = {
            algorithm: publicKey.algorithm as NamedAlgo,
            publicKey: publicKey.public_key,
            transports: publicKey.transports.split(",") as ExtendedAuthenticatorTransport[],
            id: publicKey.key_id
        };
        return await server.verifyAuthentication(verification, credential, expected);
    }
}