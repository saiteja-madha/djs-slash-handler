import fs from "fs";
import path from "path";
import Command from "./structures/Command";
import SubCommand from "./structures/SubCommand";
import SubCommandGroup from "./structures/SubCommandGroup";
import { ChatInputCommandInteraction, Collection, GuildMember, Message, PermissionResolvable } from "discord.js";
import { EventEmitter } from "node:events";
import { permissions, timeFormat } from "./utils";

type CommandHandlerOptions = {
    commandsDir: string;
    disabledCategories?: string[];
};

interface CommandHandler extends EventEmitter {
    on(event: "prefixCommandNotFound", listener: (commandName: string, message: Message) => void): this;
    on(event: "slashCommandNotFound", listener: (commandName: string, interaction: ChatInputCommandInteraction) => void): this;
    on(event: "prefixCommandError", listener: (error: Error, message: Message) => void): this;
    on(event: "slashCommandError", listener: (error: Error, interaction: ChatInputCommandInteraction) => void): this;
}

class CommandHandler extends EventEmitter {
    private options: CommandHandlerOptions;
    private commands: Command[];
    private commandIndex: Collection<string, number>;
    private cooldownCache: Map<string, number>;

    constructor(options: CommandHandlerOptions, load: boolean = true) {
        super();
        CommandHandler._validateOptions(options);
        this.options = options;
        this.commands = [];
        this.commandIndex = new Collection();
        this.cooldownCache = new Map();
        if (load) this.loadCommands();
    }

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
                    this.loadCommand(categoryCommand, cmdObj);
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
                        });
                    }

                    const subFolders = fs.readdirSync(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand));
                    const subCommandsArray = [] as SubCommand[];
                    const subCommandGroupsArray = [] as SubCommandGroup[];

                    // iterate over subcommands/subcommand-groups
                    for (const sub of subFolders) {
                        const stat = fs.lstatSync(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub));

                        // only subcommands
                        if (!stat.isDirectory() && sub != "index.js") {
                            let subCmdObj = require(path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub));
                            if (subCmdObj.default) subCmdObj = subCmdObj.default;
                            if (!(subCmdObj instanceof SubCommand)) continue;
                            if (subCommandsArray.find((cmd) => cmd.name == subCmdObj.name)) {
                                throw new Error(`Duplicate sub-command name: ${subCmdObj.name} in ${sub}`);
                            }
                            subCommandsArray.push(subCmdObj);
                        }

                        // subcommand-groups
                        else if (stat.isDirectory()) {
                            const subcommandGroup = fs.readdirSync(
                                path.join(process.cwd(), this.options.commandsDir, category, categoryCommand, sub)
                            );
                            const innerSubCommandsArray = [] as SubCommand[];
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
                                if (innerSubCommandsArray.find((cmd) => cmd.name == subCmdObj.name)) {
                                    throw new Error(`Duplicate sub-command name: ${subCmdObj.name} in ${sub}`);
                                }
                                innerSubCommandsArray.push(new SubCommand(subCmdObj));
                            }
                            subCommandGroupsArray.push(new SubCommandGroup(sub, innerSubCommandsArray));
                        }
                    }

                    cmdObj.addSubCommands(subCommandsArray).addSubCommandGroups(subCommandGroupsArray);
                    this.loadCommand(categoryCommand, cmdObj);
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

    private loadCommand(fileName: string, cmd: Command) {
        const index = this.commands.length;
        const name = cmd.name || fileName;
        if (this.commandIndex.has(name)) {
            throw new Error(`Command ${name} already registered`);
        }
        this.commandIndex.set(name, this.commands.length);
        if (Array.isArray(cmd.prefixData.aliases)) {
            for (const alias of cmd.prefixData.aliases) {
                if (this.commandIndex.has(alias)) {
                    throw new Error(`Alias ${alias} for command ${name} already registered`);
                }
                this.commandIndex.set(alias, index);
            }
        }
        this.commands.push(cmd);
    }

    private getCommand(invoke: string) {
        const index = this.commandIndex.get(invoke.toLowerCase());
        return index !== undefined ? this.commands[index] : undefined;
    }

    getPrefixCommand(message: Message, prefix: string) {
        const args = message.content.slice(prefix.length).trim().split(/ +/g);
        const commandName = args.shift()?.toLowerCase();

        const response = {
            cmd: undefined as Command | undefined,
            sub: undefined as SubCommand | undefined,
            args: args,
        };

        if (!commandName) return response;

        const command = this.getCommand(commandName);
        if (!command) {
            this.emit("prefixCommandNotFound", commandName, message);
            return response;
        }

        response.cmd = command;
        if (command.subCommands.length === 0 && command.subCommandGroups.length === 0) {
            return response;
        }

        const arg0 = args.shift();
        if (arg0) {
            const subCmd = command.subCommands.find((x) => x.name === arg0);
            if (subCmd) {
                response.sub = subCmd;
            } else {
                const arg1 = args.shift();
                if (arg1) {
                    const subCmdGroup = command.subCommandGroups.find((x) => x.name === arg0);
                    if (subCmdGroup) {
                        response.sub = subCmdGroup.subCommands.find((x) => x.name === arg1);
                    }
                }
            }
        }

        return response;
    }

    getSlashCommand(interaction: ChatInputCommandInteraction) {
        const commandName = interaction.commandName;
        const command = this.getCommand(commandName);

        const response = {
            cmd: undefined as Command | undefined,
            sub: undefined as SubCommand | undefined,
        };

        if (!command) {
            this.emit("slashCommandNotFound", commandName, interaction);
            return response;
        }

        response.cmd = command;

        if (command.subCommands.length === 0 && command.subCommandGroups.length === 0) {
            return response;
        }

        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();

        if (subCommandGroup) {
            response.sub = command.subCommandGroups.find((x) => x.name === subCommandGroup)?.subCommands.find((x) => x.name === subCommand);
        } else {
            response.sub = command.subCommands.find((x) => x.name === subCommand);
        }

        return response;
    }

    async handleInteraction(interaction: ChatInputCommandInteraction) {
        const { cmd, sub } = this.getSlashCommand(interaction);
        if (!cmd) return;

        try {
            // callback validations
            if (cmd.validations) {
                for (const validation of cmd.validations) {
                    if (!validation.callback(interaction)) {
                        await interaction.reply({ content: validation.message, ephemeral: true });
                        return;
                    }
                }
            }

            // user permissions
            if (cmd.userPermissions?.length > 0 && interaction.guild && interaction.member instanceof GuildMember) {
                if (!interaction.member.permissions.has(cmd.userPermissions)) {
                    await interaction.reply({
                        content: `You need ${CommandHandler._parsePermissions(cmd.userPermissions)} for this command`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            // bot permissions
            if (cmd.botPermissions.length > 0 && interaction.guild && interaction.guild.members.me instanceof GuildMember) {
                if (!interaction.guild.members.me.permissions.has(cmd.botPermissions)) {
                    await interaction.reply({
                        content: `I need ${CommandHandler._parsePermissions(cmd.botPermissions)} for this command`,
                        ephemeral: true,
                    });
                    return;
                }
            }

            // cooldown check
            if (cmd.cooldown > 0) {
                const remaining = this.getRemainingCooldown(interaction.user.id, cmd);
                if (remaining > 0) {
                    await interaction.reply({
                        content: `You are on cooldown. You can use this command in \`${timeFormat(remaining)}\``,
                        ephemeral: true,
                    });
                    return;
                }
            }

            // subcommand validations
            if (sub) {
                // callback validations
                if (sub.validations) {
                    for (const validation of sub.validations) {
                        if (!validation.callback(interaction)) {
                            await interaction.reply({ content: validation.message, ephemeral: true });
                            return;
                        }
                    }
                }

                // user permissions
                if (sub.userPermissions?.length > 0 && interaction.guild && interaction.member instanceof GuildMember) {
                    if (!interaction.member.permissions.has(sub.userPermissions)) {
                        await interaction.reply({
                            content: `You need ${CommandHandler._parsePermissions(sub.userPermissions)} for this command`,
                            ephemeral: true,
                        });
                        return;
                    }
                }

                // bot permissions
                if (sub.botPermissions.length > 0 && interaction.guild && interaction.guild.members.me instanceof GuildMember) {
                    if (!interaction.guild.members.me.permissions.has(sub.botPermissions)) {
                        await interaction.reply({
                            content: `I need ${CommandHandler._parsePermissions(sub.botPermissions)} for this command`,
                            ephemeral: true,
                        });
                        return;
                    }
                }

                // cooldown check
                if (sub.cooldown > 0) {
                    const remaining = this.getRemainingCooldown(interaction.user.id, cmd, sub);
                    if (remaining > 0) {
                        await interaction.reply({
                            content: `You are on cooldown. You can use this command in \`${timeFormat(remaining)}\``,
                            ephemeral: true,
                        });
                        return;
                    }
                }
            }

            // run command
            if (sub) {
                await sub.onSlashCommand(interaction);
            } else {
                await cmd.onSlashCommand(interaction);
            }

            // cooldown
            if (cmd.cooldown > 0) {
                this.applyCooldown(interaction.user.id, cmd, sub);
            }
        } catch (err) {
            this.emit("slashCommandError", err, interaction);
        }
    }

    async handleMessage(message: Message, prefix: string) {
        if (message.author.bot || !message.content.startsWith(prefix)) return;
        const { cmd, sub, args } = this.getPrefixCommand(message, prefix);

        if (!cmd) return;

        try {
            // callback validations
            if (cmd.validations) {
                for (const validation of cmd.validations) {
                    if (!validation.callback(message)) {
                        await message.channel.send({ content: validation.message });
                        return;
                    }
                }
            }

            // guild specific validations
            if (message.guild) {
                // check user permissions
                if (cmd.userPermissions?.length > 0 && !message.channel.isDMBased() && message.member) {
                    if (!message.channel.permissionsFor(message.member).has(cmd.userPermissions)) {
                        await message.channel.send({
                            content: `You need ${CommandHandler._parsePermissions(cmd.userPermissions)} for this command`,
                        });
                        return;
                    }
                }

                // check bot permissions
                if (cmd.botPermissions?.length > 0 && !message.channel.isDMBased() && message.guild.members.me) {
                    if (!message.channel.permissionsFor(message.guild.members.me).has(cmd.botPermissions)) {
                        await message.channel.send({
                            content: `I need ${CommandHandler._parsePermissions(cmd.botPermissions)} for this command`,
                        });
                        return;
                    }
                }
            }

            // minArgs count
            if (cmd.prefixData.minArgsCount > args.length) {
                await message.channel.send({
                    content: `You need to provide at least \`${cmd.prefixData.minArgsCount}\` arguments for this command`,
                });
                return;
            }

            // cooldown check
            if (cmd.cooldown > 0) {
                const remaining = this.getRemainingCooldown(message.author.id, cmd);
                if (remaining > 0) {
                    await message.channel.send({
                        content: `You are on cooldown. You can use this command in \`${timeFormat(remaining)}\``,
                    });
                    return;
                }
            }

            // subcommand validations
            if (sub) {
                // callback validations
                if (sub.validations) {
                    for (const validation of sub.validations) {
                        if (!validation.callback(message)) {
                            await message.channel.send({ content: validation.message });
                            return;
                        }
                    }
                }

                // guild specific validations
                if (message.guild) {
                    // check user permissions
                    if (sub.userPermissions?.length > 0 && !message.channel.isDMBased() && message.member) {
                        if (!message.channel.permissionsFor(message.member).has(sub.userPermissions)) {
                            await message.channel.send({
                                content: `You need ${CommandHandler._parsePermissions(sub.userPermissions)} for this command`,
                            });
                            return;
                        }
                    }

                    // check bot permissions
                    if (sub.botPermissions?.length > 0 && !message.channel.isDMBased() && message.guild.members.me) {
                        if (!message.channel.permissionsFor(message.guild.members.me).has(sub.botPermissions)) {
                            await message.channel.send({
                                content: `I need ${CommandHandler._parsePermissions(sub.botPermissions)} for this command`,
                            });
                            return;
                        }
                    }
                }

                // minArgs count
                if (sub.prefixData.minArgsCount > args.length) {
                    await message.channel.send({
                        content: `You need to provide at least \`${sub.prefixData.minArgsCount}\` arguments for this command`,
                    });
                    return;
                }

                // cooldown check
                if (sub.cooldown > 0) {
                    const remaining = this.getRemainingCooldown(message.author.id, cmd, sub);
                    if (remaining > 0) {
                        await message.channel.send({
                            content: `You are on cooldown. You can use this command in \`${timeFormat(remaining)}\``,
                        });
                        return;
                    }
                }
            }

            // run command
            if (sub) {
                await sub.onPrefixCommand(message, args);
            } else {
                await cmd.onPrefixCommand(message, args);
            }

            // cooldown
            if (cmd.cooldown > 0) {
                this.applyCooldown(message.author.id, cmd, sub);
            }
        } catch (err) {
            this.emit("prefixCommandError", err, message);
        }
    }

    applyCooldown(memberId: string, cmd: Command, sub?: SubCommand) {
        const key = sub ? `${cmd.name}-${sub.name}|${memberId}` : `${cmd.name}|${memberId}`;
        this.cooldownCache.set(key, Date.now());
    }

    getRemainingCooldown(memberId: string, cmd: Command, sub?: SubCommand) {
        const key = sub ? `${cmd.name}-${sub.name}|${memberId}` : `${cmd.name}|${memberId}`;
        if (this.cooldownCache.has(key)) {
            const remaining = (Date.now() - this.cooldownCache.get(key)!) * 0.001;
            const cooldown = sub ? sub.cooldown : cmd.cooldown;
            if (remaining > cooldown) {
                this.cooldownCache.delete(key);
                return 0;
            }
            return cooldown - remaining;
        }
        return 0;
    }

    private static _parsePermissions(perms: PermissionResolvable[]) {
        const permissionWord = `permission${perms.length > 1 ? "s" : ""}`;
        return "`" + perms.map((perm) => permissions(perm)).join(", ") + "` " + permissionWord;
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
