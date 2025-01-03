import dns from 'node:dns';
import os from 'node:os';

const options = { family: 4 };

let ip: string;
dns.lookup(os.hostname(), options, (err: any, addr: string) => {
    if (err) {
        console.error(err);
    } else {
        console.log(`IPv4 address: ${addr}`);
        ip = addr;
    }
});

export class IP {
    static get(req: any) {
        return (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection?.socket?.remoteAddress;
    }

    static getOwn() {
        return ip;
    }
}