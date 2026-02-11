import {env} from "./Environment.ts";

export const LABEL_NAME = env("LABEL_NAME", "Tri Records");
export const ROYALTY_LABEL_NAME = env("ROYALTY_LABEL_NAME", "Tri");
export const PORTAL_NAME = env("PORTAL_NAME", "Tri Artist Portal");
export const COMPANY_NAME = env("COMPANY_NAME", "Targon Industries UG");
export const COMPANY_CONTACT = env("COMPANY_CONTACT", "administration@targoninc.com");
export const MAIL_LOGO_URL = env("MAIL_LOGO_URL", "https://artists.trirecords.eu/images/LOGO128.png");
export const PORTAL_UI_URL = env("PORTAL_UI_URL", "https://artists.trirecords.eu");
export const LABEL_UI_URL = env("LABEL_WEBSITE", "https://trirecords.eu");
export const PORTAL_API_URL = env("PORTAL_API_URL", "https://artists-api.trirecords.eu");
