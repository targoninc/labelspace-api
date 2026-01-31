export interface NewsletterSignup {
    email: string;
    code: string;
    verified: boolean;
    verified_at: string | null;
    created_at: string;
    updated_at: string;
}