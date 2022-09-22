import SubCommand from "./SubCommand";

export default class SubCommandGroup {
    name: string;
    description: string;
    subCommands: SubCommand[];

    constructor(name: string, description: string, subCommands: SubCommand[]) {
        this.name = name;
        this.description = description;
        this.subCommands = subCommands;
    }

    get json() {
        return {
            name: this.name,
            description: this.description,
            type: 2,
            options: [...this.subCommands.map((subCommand) => subCommand.json)],
        };
    }
}
