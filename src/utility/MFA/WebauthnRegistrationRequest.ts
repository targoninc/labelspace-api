export interface WebauthnRegistrationRequest {
    registration: {
        user: {
            id: string;
            name: string;
            displayName: string;
        };
        credential: {
            id: string;
            publicKey: string;
            algorithm: string;
            transports: string[];
        };
        authenticatorData: string;
        clientData: string;
    },
    challenge: string;
    name: string;
}