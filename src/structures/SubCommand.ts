import { ChatInputCommandInteraction, ApplicationCommandOptionData, Message, PermissionResolvable } from "discord.js";

type PrefixCommandData = {
    enabled?: boolean;
    usage?: string;
    minArgsCount?: number;
};

type SlashCommandData = {
    enabled?: boolean;
    options?: ApplicationCommandOptionData[];
};

type Validation = {
    callback: (data: ChatInputCommandInteraction | Message) => Promise<boolean>;
    message: string;
};

export interface SubCommandData {
    name: string;
    description: string;
    cooldown?: number;
    botPermissions?: PermissionResolvable[];
    userPermissions?: PermissionResolvable[];
    validations?: Validation[];
    prefixData?: PrefixCommandData;
    slashData?: SlashCommandData;
    onPrefixCommand?: (message: Message, args: string[], data?: any) => any;
    onSlashCommand?: (interaction: ChatInputCommandInteraction, data?: any) => any;
}

export default class SubCommand {
    name: string;
    description: string;
    cooldown: number;
    botPermissions: PermissionResolvable[];
    userPermissions: PermissionResolvable[];
    validations: Validation[];
    prefixData: {
        enabled: boolean;
        usage: string;
        minArgsCount: number;
    };
    slashData: {
        enabled: boolean;
        options: ApplicationCommandOptionData[];
    };
    onPrefixCommand: (message: Message, args: string[], data?: any) => any;
    onSlashCommand: (interaction: ChatInputCommandInteraction, data?: any) => any;

    constructor(data: SubCommandData) {
        SubCommand._validate(data);
        this.name = data.name;
        this.description = data.description;
        this.cooldown = data.cooldown || 0;
        this.botPermissions = data.botPermissions || [];
        this.userPermissions = data.userPermissions || [];
        this.validations = data.validations || [];
        this.prefixData = {
            enabled: data.prefixData?.enabled === undefined ? true : data.prefixData.enabled,
            usage: data.prefixData?.usage || "",
            minArgsCount: data.prefixData?.minArgsCount || 0,
        };
        this.slashData = {
            enabled: data.slashData?.enabled === undefined ? true : data.slashData.enabled,
            options: data.slashData?.options || [],
        };
        this.onPrefixCommand = data.onPrefixCommand || (() => {});
        this.onSlashCommand = data.onSlashCommand || (() => {});
    }

    get json() {
        return {
            name: this.name,
            description: this.description,
            type: 1,
            options: this.slashData.options,
        };
    }

    private static _validate(data: SubCommandData) {
        if (typeof data.name !== "string") throw new TypeError("SubCommand name must be a string.");
        const { name } = data;
        if (typeof data.description !== "string") {
            throw new TypeError(`SubCommand - description must be a string: ${name}`);
        }
        // validate prefixData
        if (data.prefixData && typeof data.prefixData !== "object") {
            throw new TypeError(`SubCommand - prefixData must be an object: ${name}`);
        }
        if (data.prefixData?.enabled && typeof data.prefixData.enabled !== "boolean") {
            throw new TypeError(`SubCommand - prefixData.enabled must be a boolean: ${name}`);
        }
        if (data.prefixData?.usage && typeof data.prefixData.usage !== "string") {
            throw new TypeError(`SubCommand - prefixData.usage must be a string: ${name}`);
        }
        if (data.prefixData?.minArgsCount && typeof data.prefixData.minArgsCount !== "number") {
            throw new TypeError(`SubCommand - prefixData.minArgsCount must be a number: ${name}`);
        }

        // validate slashData
        if (data.slashData && typeof data.slashData !== "object") {
            throw new TypeError(`SubCommand - slashData must be an object: ${name}`);
        }
        if (data.slashData?.enabled && typeof data.slashData.enabled !== "boolean") {
            throw new TypeError(`SubCommand - slashData.enabled must be a boolean: ${name}`);
        }
        if (data.slashData?.options && !Array.isArray(data.slashData.options)) {
            throw new TypeError(`SubCommand - slashData.options must be an array: ${name}`);
        }
        if (typeof data.slashData?.enabled === "undefined" || data.slashData.enabled) {
            if (typeof data.onSlashCommand !== "function") {
                throw new TypeError(`SubCommand - onSlashCommand must be a function: ${name}`);
            }
        }
    }
}
