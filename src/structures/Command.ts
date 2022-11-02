import { ApplicationCommandOptionData, ChatInputCommandInteraction, Message, PermissionResolvable } from "discord.js";
import SubCommand from "./SubCommand";
import SubCommandGroup from "./SubCommandGroup";

type PrefixCommandData = {
    enabled?: boolean;
    aliases?: string[];
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

export interface CommandData {
    name: string;
    description: string;
    cooldown?: number;
    botPermissions?: PermissionResolvable[];
    userPermissions?: PermissionResolvable[];
    validations?: Validation[];
    prefixData?: PrefixCommandData;
    slashData?: SlashCommandData;
    onPrefixCommand?: (message: Message, args: string[]) => any;
    onSlashCommand?: (interaction: ChatInputCommandInteraction) => any;
}

export default class Command {
    name: string;
    description: string;
    cooldown: number;
    botPermissions: PermissionResolvable[];
    userPermissions: PermissionResolvable[];
    validations: Validation[];
    prefixData: {
        enabled: boolean;
        aliases: string[];
        usage: string;
        minArgsCount: number;
    };
    slashData: {
        enabled: boolean;
        options: ApplicationCommandOptionData[];
    };
    onPrefixCommand: (message: Message, args: string[]) => any;
    onSlashCommand: (interaction: ChatInputCommandInteraction) => any;

    subCommands: SubCommand[] = [];
    subCommandGroups: SubCommandGroup[] = [];

    constructor(data: CommandData) {
        Command._validate(data);
        this.name = data.name;
        this.description = data.description;
        this.cooldown = data.cooldown || 0;
        this.botPermissions = data.botPermissions || [];
        this.userPermissions = data.userPermissions || [];
        this.validations = data.validations || [];
        this.prefixData = {
            enabled: data.prefixData?.enabled === undefined ? true : data.prefixData.enabled,
            aliases: data.prefixData?.aliases || [],
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
            options:
                this.subCommands?.length == 0 && this.subCommandGroups?.length == 0
                    ? this.slashData.options
                    : [
                          ...(this.subCommands?.map((subCommand) => subCommand.json) || []),
                          ...(this.subCommandGroups?.map((subCommandGroup) => subCommandGroup.json) || []),
                      ],
        };
    }

    addSubCommands(subCommands: SubCommand[]) {
        this.subCommands = subCommands;
        return this;
    }

    addSubCommandGroups(subCommandGroups: SubCommandGroup[]) {
        this.subCommandGroups = subCommandGroups;
        return this;
    }

    private static _validate(data: CommandData) {
        if (typeof data.name !== "string") throw new TypeError("Command name must be a string.");
        const { name } = data;
        if (typeof data.description !== "string") throw new TypeError(`Command description must be a string: ${name}`);

        // validate prefixData
        if (data.prefixData) {
            if (typeof data.prefixData !== "object") {
                throw new TypeError(`Command - prefixData must be an object: ${name}`);
            }
            if (data.prefixData.enabled && typeof data.prefixData.enabled !== "boolean") {
                throw new TypeError(`Command - prefixData.enabled must be a boolean: ${name}`);
            }
            if (data.prefixData.aliases && !Array.isArray(data.prefixData.aliases)) {
                throw new TypeError(`Command - prefixData.aliases must be an array: ${name}`);
            }
            if (data.prefixData.usage && typeof data.prefixData.usage !== "string") {
                throw new TypeError(`Command - prefixData.usage must be a string: ${name}`);
            }
            if (data.prefixData.minArgsCount && typeof data.prefixData.minArgsCount !== "number") {
                throw new TypeError(`Command - prefixData.minArgsCount must be a number: ${name}`);
            }
            if (typeof data.prefixData.enabled === "undefined" || data.prefixData.enabled) {
                if (typeof data.onPrefixCommand !== "function") {
                    throw new TypeError(`SubCommand - onPrefixCommand must be a function: ${name}`);
                }
            }
        }

        // validate slashData
        if (data.slashData) {
            if (typeof data.slashData !== "object") {
                throw new TypeError(`Command - slashData must be an object: ${name}`);
            }
            if (data.slashData.enabled && typeof data.slashData.enabled !== "boolean") {
                throw new TypeError(`Command - slashData.enabled must be a boolean: ${name}`);
            }
            if (data.slashData.options && !Array.isArray(data.slashData.options)) {
                throw new TypeError(`Command - slashData.options must be an array: ${name}`);
            }
            if (typeof data.slashData?.enabled === "undefined" || data.slashData.enabled) {
                if (typeof data.onSlashCommand !== "function") {
                    throw new TypeError(`SubCommand - onSlashCommand must be a function: ${name}`);
                }
            }
        }
    }
}
