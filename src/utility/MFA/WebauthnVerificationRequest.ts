import {AuthenticationJSON} from "@passwordless-id/webauthn/dist/esm/types";

export interface WebauthnVerificationRequest {
    verification: AuthenticationJSON;
    challenge: string;
}