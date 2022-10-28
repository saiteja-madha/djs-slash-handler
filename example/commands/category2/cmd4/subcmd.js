const { SubCommand } = require("djs-slash-handler");

module.exports = new SubCommand({
    name: "subcmd",
    description: "description for cmd4 > subcmd",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd4 > subcmd");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd4 > subcmd");
    },
});
