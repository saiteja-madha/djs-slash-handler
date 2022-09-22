import { ChatInputCommandInteraction, ApplicationCommandOptionData } from "discord.js";

export type SubCommandData = {
    name: string;
    description: string;
    options: ApplicationCommandOptionData[];
    callback: (interaction: ChatInputCommandInteraction) => any;
};

export default class SubCommand {
    name: string;
    description: string;
    options: ApplicationCommandOptionData[];
    callback: (interaction: ChatInputCommandInteraction) => any;

    constructor(name: string, data: SubCommandData) {
        SubCommand.validate(name, data);
        this.name = name;
        this.description = data.description;
        this.options = data.options;
        this.callback = data.callback;
    }

    get json() {
        return {
            name: this.name,
            description: this.description,
            type: 1,
            options: this.options,
        };
    }

    static validate(name: string, data: SubCommandData) {
        if (typeof data.description !== "string") throw new TypeError(`SubCommand description must be a string: ${name}`);
    }
}
