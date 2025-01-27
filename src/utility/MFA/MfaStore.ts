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

    hasUncompletedMfaProcess(id: number) {
        const userProcesses = this.store.filter(p => p.user_id === id);

        for (const process of userProcesses) {
            if (!process.verified) {
                return true;
            }
        }

        return false;
    }

    completeMfaProcesses(userId: number) {
        for (const process of this.store) {
            if (process.user_id === userId) {
                process.verified = true;
                process.expires_at = new Date(new Date().getTime() + 1000 * 60 * 5);
            }
        }
    }

    hasCompletedMfaProcess(userId: number) {
        return this.store.some(p => p.user_id === userId && p.verified);
    }
}