const fs = require("fs");
const path = require("path");
const Command = require("./structures/Command");
const SubCommand = require("./structures/SubCommand");
const SubCommandGroup = require("./structures/SubCommandGroup");

class CommandHandler {
    /**
     * @typedef {Object} CommandHandlerOptions
     * @property {string} path - path to commands
     * @property {string[]} [disabledCategories] - categories to disable
     */

    /**
     * @param {CommandHandlerOptions} options
     * @param {boolean} [load] - load commands
     */
    constructor(options, load = true) {
        this.constructor.validateOptions(options);
        /**
         * @private
         */
        this.options = options;
        /**
         * @type {Map<string, Command>}
         * @private
         */
        this.commands = new Map();
        if (load) this.loadCommands();
    }

    /**
     * Load commands from specified path
     */
    loadCommands() {
        const categories = fs.readdirSync(path.join(process.cwd(), this.options.path));
        for (const category of categories) {
            if (this.options.disabledCategories.includes(category)) continue;
            const categoryCommands = fs.readdirSync(path.join(process.cwd(), this.options.path, category));

            // iterate over commands in a category
            for (const categoryCommand of categoryCommands) {
                const stat = fs.lstatSync(path.join(process.cwd(), this.options.path, category, categoryCommand));

                // command without subcommands/subcommand-groups
                if (!stat.isDirectory()) {
                    const cmdObj = require(path.join(process.cwd(), this.options.path, category, categoryCommand));
                    if (cmdObj?.enabled === false) continue;
                    const fileName = categoryCommand.split(".")[0];
                    const command = new Command(fileName, cmdObj);
                    this.commands.set(fileName, command);
                }

                // command with subcommands/subcommand-groups
                else {
                    let _defaultCmdData;
                    try {
                        _defaultCmdData = require(path.join(process.cwd(), this.options.path, category, categoryCommand, "index.js"));
                    } catch (err) {
                        // default command metadata
                        _defaultCmdData = {
                            enabled: true,
                            description: `description for ${categoryCommand}`,
                            aliases: [],
                            ephemeral: false,
                        };
                    }

                    const subFolders = fs.readdirSync(path.join(process.cwd(), this.options.path, category, categoryCommand));
                    const subCommandsArray = [];
                    const subCommandGroupsArray = [];

                    // iterate over subcommands/subcommand-groups
                    for (const sub of subFolders) {
                        const stat = fs.lstatSync(path.join(process.cwd(), this.options.path, category, categoryCommand, sub));

                        // only subcommands
                        if (!stat.isDirectory() && sub != "index.js") {
                            const subCmdObj = require(path.join(process.cwd(), this.options.path, category, categoryCommand, sub));
                            if (subCmdObj?.enabled === false) continue;
                            const fileName = sub.split(".")[0];
                            subCommandsArray.push(new SubCommand(fileName, subCmdObj));
                        }

                        // subcommand-groups
                        else if (stat.isDirectory()) {
                            const subcommandGroup = fs.readdirSync(path.join(process.cwd(), this.options.path, category, categoryCommand, sub));
                            const innerSubCommandsArray = [];

                            let _defaultCmdGroupData;
                            try {
                                _defaultCmdGroupData = require(path.join(
                                    process.cwd(),
                                    this.options.path,
                                    category,
                                    categoryCommand,
                                    sub,
                                    "index.js"
                                ));
                            } catch (err) {
                                // default command metadata
                                _defaultCmdGroupData = {
                                    description: `description for ${sub}`,
                                };
                            }

                            for (const subCommand of subcommandGroup) {
                                const subCmdObj = require(path.join(process.cwd(), this.options.path, category, categoryCommand, sub, subCommand));
                                if (subCmdObj?.enabled === false) continue;
                                const fileName = subCommand.split(".")[0];
                                innerSubCommandsArray.push(new SubCommand(fileName, subCmdObj));
                            }

                            subCommandGroupsArray.push(new SubCommandGroup(sub, _defaultCmdGroupData.description, innerSubCommandsArray));
                        }
                    }

                    const cmdObj = new Command(categoryCommand, _defaultCmdData, subCommandsArray, subCommandGroupsArray);
                    this.commands.set(categoryCommand, cmdObj);
                }
            }
        }
    }

    getCommandsJSON() {
        const toRegister = [];
        for (const command of this.commands.values()) {
            toRegister.push(command.json);
        }
        return toRegister;
    }

    getCommandCallBack(interaction) {
        const commandName = interaction.commandName;
        const command = this.commands.get(commandName);

        if (!command) return console.log("Command not found");
        if (command.subCommands.length === 0 && command.subCommandGroups.length === 0) return command.callback;

        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();

        if (subCommandGroup) {
            return command.subCommandGroups.find((x) => x.name === subCommandGroup).subCommands.find((x) => x.name === subCommand).callback;
        } else {
            return command.subCommands.find((x) => x.name === subCommand).callback;
        }
    }

    async handleInteraction(interaction) {
        const fn = this.getCommandCallBack(interaction);
        await fn(interaction);
    }

    /**
     * @param {CommandHandlerOptions} options
     */
    static validateOptions(options) {
        if (!options) throw new Error("No options provided");
        if (!options.path) throw new Error("No path for commands provided");
        if (options.disabledCategories) {
            if (!Array.isArray(options.disabledCategories)) throw new Error("disabledCategories must be an array");
            if (options.disabledCategories.find((x) => typeof x !== "string")) throw new Error("disabledCategories must be an array of strings");
        }
    }
}

module.exports = CommandHandler;
