import fs from "fs";
import path from "path";
import Command from "./structures/Command";
import SubCommand from "./structures/SubCommand";
import SubCommandGroup from "./structures/SubCommandGroup";
import { ChatInputCommandInteraction, Message } from "discord.js";

type CommandHandlerOptions = {
    commandsDir: string;
    disabledCategories?: string[];
};

class CommandHandler {
    private options: CommandHandlerOptions;
    commands: Map<string, Command>;

    constructor(options: CommandHandlerOptions, load: boolean = true) {
        CommandHandler._validateOptions(options);
        this.options = options;
        this.commands = new Map();
        if (load) this.loadCommands();
    }

    /**
     * Load commands from specified path
     */
    loadCommands() {
        const categories = fs.readdirSync(path.join(process.cwd(), this.options.commandsDir));
        for (const category of categories) {
            if (this.options.disabledCategories?.includes(category)) continue;
            const categoryCommands = fs.readdirSync(path.join(process.cwd(), this.options.commandsDir, category));

            // iterate over commands in a category
            for (const categoryCommand of categoryCommands) {
                const stat = fs.lstatSync(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand));

                // command without subcommands/subcommand-groups
                if (!stat.isDirectory()) {
                    let cmdObj = require(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand));
                    if (cmdObj.default) cmdObj = cmdObj.default;
                    if (!(cmdObj instanceof Command)) continue;
                    this.commands.set(cmdObj.name, cmdObj);
                }

                // command with subcommands/subcommand-groups
                else {
                    let cmdObj;
                    try {
                        cmdObj = require(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, "index.js"));
                        if (cmdObj.default) cmdObj = cmdObj.default;
                        if (!(cmdObj instanceof Command)) continue;
                    } catch (err) {
                        // default command metadata
                        cmdObj = new Command({
                            name: categoryCommand,
                            description: `description for ${categoryCommand}`,
                            prefixData: {},
                            slashData: {},
                        });
                    }

                    const subFolders = fs.readdirSync(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand));
                    const subCommandsArray = [];
                    const subCommandGroupsArray = [];

                    // iterate over subcommands/subcommand-groups
                    for (const sub of subFolders) {
                        const stat = fs.lstatSync(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub));

                        // only subcommands
                        if (!stat.isDirectory() && sub != "index.js") {
                            let subCmdObj = require(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub));
                            if (subCmdObj.default) subCmdObj = subCmdObj.default;
                            if (!(subCmdObj instanceof SubCommand)) continue;
                            subCommandsArray.push(subCmdObj);
                        }

                        // subcommand-groups
                        else if (stat.isDirectory()) {
                            const subcommandGroup = fs.readdirSync(
                                path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub)
                            );
                            const innerSubCommandsArray = [];

                            let _defaultCmdGroupData;
                            try {
                                _defaultCmdGroupData = require(path.join(
                                    process.cwd(),
                                    this.options.commandsDir,
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
                                let subCmdObj = require(path.join(
                                    process.cwd(),
                                    this.options.commandsDir,
                                    category,
                                    categoryCommand,
                                    sub,
                                    subCommand
                                ));
                                if (subCmdObj.default) subCmdObj = subCmdObj.default;
                                if (!(subCmdObj instanceof SubCommand)) continue;
                                innerSubCommandsArray.push(new SubCommand(subCmdObj));
                            }

                            subCommandGroupsArray.push(new SubCommandGroup(sub, _defaultCmdGroupData.description, innerSubCommandsArray));
                        }
                    }

                    cmdObj.addSubCommands(subCommandsArray).addSubCommandGroups(subCommandGroupsArray);
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

    getSlashCommandCallback(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName;
        const command = this.commands.get(commandName);

        if (!command) return;
        if (command.subCommands.length === 0 && command.subCommandGroups.length === 0) return command.onSlashCommand;

        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();

        if (subCommandGroup) {
            return command.subCommandGroups.find((x) => x.name === subCommandGroup)?.subCommands.find((x) => x.name === subCommand)?.onSlashCommand;
        } else {
            return command.subCommands.find((x) => x.name === subCommand)?.onSlashCommand;
        }
    }

    getPrefixCommandCallBack(message: Message, prefix: string) {
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift()?.toLowerCase();
        if (!commandName) return;

        const command = this.commands.get(commandName);
        if (!command) return;

        let callback;

        if (command.subCommands.length === 0 && command.subCommandGroups.length === 0) {
            callback = command.onPrefixCommand;
        } else {
            const arg0 = args.shift();
            if (arg0) {
                const subCmd = command.subCommands.find((x) => x.name === arg0);
                if (subCmd) {
                    callback = subCmd.onPrefixCommand;
                } else {
                    const arg1 = args.shift();
                    if (arg1) {
                        const subCmdGroup = command.subCommandGroups.find((x) => x.name === arg0);
                        if (subCmdGroup) {
                            const subCmd = subCmdGroup.subCommands.find((x) => x.name === arg1);
                            if (subCmd) callback = subCmd.onPrefixCommand;
                        }
                    }
                }
            }
        }

        if (callback) {
            return { callback, args };
        }
    }

    async handleInteraction(interaction: ChatInputCommandInteraction) {
        const fn = this.getSlashCommandCallback(interaction);
        if (fn) await fn(interaction);
    }

    async handleMessage(message: Message, prefix: string) {
        if (message.author.bot || !message.content.startsWith(prefix)) return;
        const res = this.getPrefixCommandCallBack(message, prefix);
        if (res) await res.callback(message, res.args);
    }

    private static _validateOptions(options: CommandHandlerOptions) {
        if (!options) throw new Error("No options provided");
        if (!options.commandsDir) throw new Error("No path for commands provided");
        if (options.disabledCategories) {
            if (!Array.isArray(options.disabledCategories)) throw new Error("disabledCategories must be an array");
            if (options.disabledCategories.find((x) => typeof x !== "string")) throw new Error("disabledCategories must be an array of strings");
        }
    }
}

export default CommandHandler;
