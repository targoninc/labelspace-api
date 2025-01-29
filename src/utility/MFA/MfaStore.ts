interface MfaProcess {
    id: number;
    user_id: number;
    method_type: "totp" | "email";
    created_at: Date;
    expires_at: Date;
    verified: boolean;
}

export class MfaStore {
    private store: MfaProcess[] = [];

    constructor() {
        setInterval(() => {
            for (const process of this.store) {
                if (process.expires_at < new Date()) {
                    this.store = this.store.filter(p => p.id !== process.id);
                }
            }
        }, 1000 * 60);
    }

    /**
     * Is used to create a new MFA process for TOTP or email.
     * @param user_id The user ID
     * @param method_type The method type (totp or email)
     */
    createMfaProcess(user_id: number, method_type: "totp" | "email") {
        const process: MfaProcess = {
            id: Math.random(),
            user_id,
            method_type,
            created_at: new Date(),
            expires_at: new Date(new Date().getTime() + 1000 * 60 * 5),
            verified: false
        };
        this.store.push(process);
        return process;
    }

    /**
     * Checks if there are any uncompleted MFA processes for the given user ID.
     * @param id The user ID
     */
    hasUncompletedMfaProcess(id: number) {
        const userProcesses = this.store.filter(p => p.user_id === id);

        for (const process of userProcesses) {
            if (!process.verified) {
                return true;
            }
        }

        return false;
    }

    /**
     * Completes all MFA processes for the given user ID.
     * @param userId The user ID
     */
    completeMfaProcesses(userId: number) {
        for (const process of this.store) {
            if (process.user_id === userId) {
                process.verified = true;
                process.expires_at = new Date(new Date().getTime() + 1000 * 60 * 5);
            }
        }
    }

    /**
     * Checks if there is a recently completed MFA process for the given user ID.
     * @param userId The user ID
     */
    hasCompletedMfaProcess(userId: number) {
        const userProcesses = this.store.filter(p => p.user_id === userId);
        return userProcesses.filter(p => !p.verified).length === 0;
    }
}