const { SubCommand } = require("djs-slash-handler");

module.exports = new SubCommand({
    name: "subcmd1",
    description: "description for cmd3 > subcmd1",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd3 > subcmd1");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd3 > subcmd1");
    },
});
