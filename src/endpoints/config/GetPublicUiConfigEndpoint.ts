import {Application, Request, Response} from "express";
import {GetEndpoint} from "../base/GetEndpoint.js";
import {COMPANY_CONTACT, LABEL_NAME, LABEL_UI_URL, PORTAL_API_URL} from "../../utility/Constants.ts";

export class GetPublicUiConfigEndpoint extends GetEndpoint {
    constructor(app: Application, path: string) {
        super(app, path);
    }

    run(req: Request, res: Response) {
        return res.send({
            labelUiUrl: LABEL_UI_URL,
            portalApiUrl: PORTAL_API_URL,
            contactEmail: COMPANY_CONTACT,
            labelName: LABEL_NAME,
        });
    }
}
