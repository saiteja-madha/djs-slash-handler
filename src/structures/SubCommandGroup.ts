import SubCommand from "./SubCommand";

export default class SubCommandGroup {
    name: string;
    subCommands: SubCommand[];

    constructor(name: string, subCommands: SubCommand[]) {
        this.name = name;
        this.subCommands = subCommands;
    }

    get json() {
        return {
            name: this.name,
            description: `description for ${this.name}`,
            type: 2,
            options: [...this.subCommands.map((subCommand) => subCommand.json)],
        };
    }
}
