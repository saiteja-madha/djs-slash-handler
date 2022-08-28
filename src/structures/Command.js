const SubCommand = require("./SubCommand");
const SubCommandGroup = require("./SubCommandGroup");

module.exports = class Command {
    /**
     * @param {string} name
     * @param {object} data
     * @param {SubCommand[]} [subCommands]
     * @param {SubCommandGroup[]} [subCommandGroups]
     */
    constructor(name, data, subCommands = [], subCommandGroups = []) {
        this.constructor.validate(name, subCommands.length || subCommandGroups.length, data);
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

    /**
     * @param {string} name
     * @param {boolean} containsSubCommand
     * @param {object} data
     */
    static validate(name, containsSubCommand, data) {
        if (typeof data.description !== "string") throw new TypeError(`Command description must be a string: ${name}`);
        if (!containsSubCommand && typeof data.callback !== "function") throw new TypeError(`Command callback must be a function: ${name}`);
    }
};
