import { ApplicationCommandOptionData, ChatInputCommandInteraction, Message } from "discord.js";
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

export interface CommandData {
    name: string;
    description: string;
    prefixData?: PrefixCommandData;
    slashData?: SlashCommandData;
    onPrefixCommand?: (message: Message, args: string[]) => any;
    onSlashCommand?: (interaction: ChatInputCommandInteraction) => any;
}

export default class Command {
    name: string;
    description: string;
    prefixData: PrefixCommandData;
    slashData: SlashCommandData;
    onPrefixCommand: (message: Message, args: string[]) => any;
    onSlashCommand: (interaction: ChatInputCommandInteraction) => any;

    subCommands: SubCommand[] = [];
    subCommandGroups: SubCommandGroup[] = [];

    constructor(data: CommandData) {
        Command.validate(data.name, data);
        this.name = data.name;
        this.description = data.description;
        this.prefixData = {
            enabled: data.prefixData?.enabled === undefined ? true : data.prefixData.enabled,
            aliases: data.prefixData?.aliases || [],
            usage: data.prefixData?.usage || "",
            minArgsCount: data.prefixData?.minArgsCount || 0,
        };
        this.slashData = {
            enabled: data.slashData?.enabled === undefined ? true : data.prefixData?.enabled,
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

    static validate(name: string, data: CommandData) {
        if (typeof data.description !== "string") throw new TypeError(`Command description must be a string: ${name}`);
    }
}
