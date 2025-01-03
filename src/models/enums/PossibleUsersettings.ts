export const possibleUsersettings: UsersettingDefinitions = {
    paypalMail: {
        name: "paypalMail",
        type: "boolean",
        description: "Your PayPal email address for receiving payments",
    },
    theme: {
        name: "theme",
        type: "string",
        description: "The theme to use for the UI",
    },
}

export interface UsersettingDefinitions {
    theme: UsersettingDefinition,
    paypalMail: UsersettingDefinition,
    [key: string]: UsersettingDefinition
}

export interface UsersettingDefinition {
    name: string,
    type: "boolean" | "string",
    description: string,
}