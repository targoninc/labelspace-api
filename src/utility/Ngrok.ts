import ngrok from '@ngrok/ngrok';
import {CLI} from "@targoninc/ts-logging";
import {Paypal} from "./Paypal/Paypal.ts";

export async function setupNgrok(port: number) {
    if (!process.env.NGROK_AUTHTOKEN) {
        return;
    }

    const listener = await ngrok.forward({
        addr: `http://localhost:${port}`,
        authtoken: process.env.NGROK_AUTHTOKEN
    });

    CLI.debug(`Ingress established at: ${listener.url()}`, {
        logToDb: true,
        info: {
            listener
        }
    });

    process.stdin.resume();
    const url = listener.url() + "/webhooks/paypal";

    await Paypal.createWebhook(url);
    CLI.success("Webhook proxy registered", {
        logToDb: true
    });

    const whs = await Paypal.listWebhooks();
    for (const wh of whs.webhooks) {
        if (wh.url !== url) {
            if (wh.url.includes("ngrok")) {
                await Paypal.deleteWebhook(wh.id);
            }
            continue;
        }
        process.env.PAYPAL_WEBHOOK_ID = wh.id;
    }

    const unregister = async () => {
        await Paypal.deleteWebhook(process.env.PAYPAL_WEBHOOK_ID);
        CLI.success("Webhook proxy unregistered", {
            logToDb: true
        });
        process.exit(0);
    };

    process.on("SIGINT", unregister);
    process.on("SIGKILL", unregister);
}