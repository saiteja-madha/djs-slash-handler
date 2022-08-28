const SubCommand = require("./SubCommand");

module.exports = class SubCommandGroup {
    /**
     * @param {string} name
     * @param {string} description
     * @param {SubCommand[]} subCommands
     */
    constructor(name, description, subCommands = []) {
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
};
