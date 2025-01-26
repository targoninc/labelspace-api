import {authenticator} from 'otplib';
import qrcode from 'qrcode';
import {User} from "../../models/db/tri/User.ts";

export class TOTP {
    static newSecret() {
        return authenticator.generateSecret();
    }

    static generateToken(secret: string) {
        return authenticator.generate(secret);
    }

    static checkToken(token: string, secret: string) {
        return authenticator.check(token, secret);
    }

    static async generateQR(user: User, secret: string) {
        const service = 'TriArtists';

        // v11.x and above
        const otpauth = authenticator.keyuri(user.username, service, secret);
        return new Promise<string>((resolve, reject) => {
            qrcode.toDataURL(otpauth, (err, imageUrl) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(imageUrl);
            });
        });
    }
}