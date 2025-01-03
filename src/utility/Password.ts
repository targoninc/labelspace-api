import bcrypt from "bcryptjs";

export interface PasswordValidationResult {
    code: number;
    error?: string;
    hashedPassword?: string;
}

export class Password {
    static validate(newPassword: string, passwordConfirm: string, oldPassword: string): PasswordValidationResult {
        if (!oldPassword) {
            return {
                code: 400,
                error: "No old password provided"
            }
        }

        if (newPassword === oldPassword) {
            return {
                code: 400,
                error: "New password must be different from old password"
            }
        }

        const result = Password.validateNewPassword(newPassword, passwordConfirm);
        if (result.code !== 200) {
            return result;
        }

        return {
            code: 200,
            hashedPassword: bcrypt.hashSync(newPassword, 12)
        };
    }

    static validateNewPassword(newPassword: string, passwordConfirm: string): PasswordValidationResult {
        const minLength = 8;
        const maxLength = 64;

        let error;
        if (!newPassword) {
            error = "No password provided";
        } else if (!passwordConfirm) {
            error = "No password confirm provided";
        } else if (newPassword !== passwordConfirm) {
            error = "New passwords do not match";
        } else if (newPassword.length < minLength) {
            error = `New password must be at least ${minLength} characters long`
        } else if (newPassword.length > maxLength) {
            error = `New password must be at most ${maxLength} characters long`;
        }

        if (error) {
            return {
                code: 400,
                error
            }
        }

        return {
            code: 200,
            hashedPassword: bcrypt.hashSync(newPassword, 12)
        };
    }
}