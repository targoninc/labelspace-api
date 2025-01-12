import type {BandcampAuthorizationResponse,} from "./BandcampAuthorizationResponse.ts";
import {BandcampCredentialType} from "./BandcampCredentialType.ts";
import type {SalesReport} from "./SalesReport.ts";
import {CLI} from "../CLI.ts";

let auth: BandcampAuthorizationResponse|null = null;
let lastAuth = 0;

export class Bandcamp {
    static async authorize(): Promise<BandcampAuthorizationResponse> {
        const clientId = process.env.BANDCAMP_CLIENT_ID;
        const clientSecret = process.env.BANDCAMP_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new Error("BANDCAMP_CLIENT_ID and BANDCAMP_CLIENT_SECRET must be set");
        }

        if (auth && auth.ok && auth.expires_in) {
            return Bandcamp.refreshAccessToken();
        }
        const params = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: BandcampCredentialType.client_credentials
        };
        const urlParams = new URLSearchParams(params);

        const url = `https://bandcamp.com/oauth_token` + "?" + urlParams;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!res.ok && res.status === 401) {
            return Bandcamp.refreshAccessToken();
        }
        const data = await res.json();
        if (data.ok) {
            auth = data as BandcampAuthorizationResponse;
            lastAuth = Date.now();
        } else {
            console.log(data);
            throw new Error("Failed to get access token: " + data.exception);
        }
        return data;
    }

    private static async refreshAccessToken() {
        const clientId = process.env.BANDCAMP_CLIENT_ID;
        const clientSecret = process.env.BANDCAMP_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            throw new Error("BANDCAMP_CLIENT_ID and BANDCAMP_CLIENT_SECRET must be set");
        }

        const params = {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: BandcampCredentialType.refresh_token,
            refresh_token: auth!.refresh_token
        };
        const urlParams = new URLSearchParams(params);
        const url = `https://bandcamp.com/oauth_token` + "?" + urlParams;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!res.ok) {
            throw new Error("Failed to refresh access token");
        }
        const data = await res.json();
        if (data.ok) {
            auth = data as BandcampAuthorizationResponse;
            lastAuth = Date.now();
        } else {
            throw new Error("Failed to refresh access token: " + data.exception);
        }
        return data;
    }

    static async callBandcampApi(url: string, params: any) {
        if (!auth || !auth.ok) {
            await Bandcamp.authorize();
        }

        CLI.debug("Calling Bandcamp API", {
            logToDb: true,
            info: {
                url,
                params
            }
        });
        const start = performance.now();
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + auth!.access_token,
            },
            body: JSON.stringify(params)
        });
        const diff = performance.now() - start;
        const s = diff / 1000;
        console.log(`Bandcamp API took ${s.toFixed(2)}s`);

        const text = await res.text();
        const json = JSON.parse(text);
        if (!res.ok || json.error) {
            console.log(json);
            throw new Error("Failed to call Bandcamp API: " + (json.error_message ?? json.message));
        }
        return json;
    }

    static async getSalesReport(from: Date, to: Date = new Date()) {
        if (!process.env.BANDCAMP_BAND_ID) {
            throw new Error("BANDCAMP_BAND_ID must be set");
        }

        return Bandcamp.mapSalesReport(await Bandcamp.callBandcampApi("https://bandcamp.com/api/sales/2/sales_report", {
            band_id: parseInt(process.env.BANDCAMP_BAND_ID),
            start_time: from.toISOString().replace("T", " ").substring(0, 19),
            end_time: to.toISOString().replace("T", " ").substring(0, 19),
            format: "json"
        }));
    }

    static mapSalesReport(report: Record<string, any>): SalesReport {
        const sales = [];
        const payouts = [];

        for (const key of Object.keys(report)) {
            const item = report[key];
            if (item.item_type === "payout") {
                payouts.push(item);
            } else {
                sales.push(item);
            }
        }

        return {
            sales,
            payouts
        }
    }
}