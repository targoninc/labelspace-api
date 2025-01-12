export interface BandcampAuthorizationResponse {
    expires_in: number;
    access_token: string;
    refresh_token: string;
    ok: boolean;
    token_type: string;
}

export interface BandcampAuthorizationResponseError {
    ok: false;
    url: string;
    exception: string;
    error: boolean;
    host: string;
    date: string;
    user: string;
    member_of_current_band: null;
}