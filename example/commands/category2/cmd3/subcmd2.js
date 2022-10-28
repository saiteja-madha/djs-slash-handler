const { SubCommand } = require("djs-slash-handler");

module.exports = new SubCommand({
    name: "subcmd2",
    description: "description for cmd3 > subcmd2",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd3 > subcmd2");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd3 > subcmd2");
    },
});
