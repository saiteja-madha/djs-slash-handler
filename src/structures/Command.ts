import { ApplicationCommandOptionData, ChatInputCommandInteraction } from "discord.js";
import SubCommand from "./SubCommand";
import SubCommandGroup from "./SubCommandGroup";

export type CommandData = {
    description: string;
    options: ApplicationCommandOptionData[];
    callback?: (interaction: ChatInputCommandInteraction) => any;
};

export default class Command {
    name: string;
    description: string;
    options: ApplicationCommandOptionData[];
    subCommands: SubCommand[];
    subCommandGroups: SubCommandGroup[];
    callback?: (interaction: ChatInputCommandInteraction) => any;

    constructor(name: string, data: CommandData, subCommands: SubCommand[], subCommandGroups: SubCommandGroup[]) {
        Command.validate(name, (subCommands.length || subCommandGroups.length) > 0, data);
        this.name = name;
        this.description = data.description;
        this.options = data.options || [];
        this.subCommands = subCommands;
        this.subCommandGroups = subCommandGroups;
        this.callback = data.callback;
    }

    get json() {
        return {
            name: this.name,
            description: this.description,
            options:
                this.subCommands.length == 0 && this.subCommandGroups.length == 0
                    ? this.options
                    : [
                          ...this.subCommands.map((subCommand) => subCommand.json),
                          ...this.subCommandGroups.map((subCommandGroup) => subCommandGroup.json),
                      ],
        };
    }

    static validate(name: string, containsSubCommand: boolean, data: CommandData) {
        if (typeof data.description !== "string") throw new TypeError(`Command description must be a string: ${name}`);
        if (!containsSubCommand && typeof data.callback !== "function") throw new TypeError(`Command callback must be a function: ${name}`);
    }
}
