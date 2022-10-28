const { Command } = require("djs-slash-handler");

module.exports = new Command({
    name: "cmd1",
    description: "description for cmd1",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd1");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd1");
    },
});
