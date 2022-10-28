const { Command } = require("djs-slash-handler");

module.exports = new Command({
    name: "cmd2",
    description: "description for cmd2",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd2");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd2");
    },
});
