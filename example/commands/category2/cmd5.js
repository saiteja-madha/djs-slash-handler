const { Command } = require("djs-slash-handler");

module.exports = new Command({
    name: "cmd5",
    description: "description for cmd5",

    async onPrefixCommand(message, args) {
        message.reply("Response for cmd5");
    },

    async onSlashCommand(interaction) {
        await interaction.reply("Response for cmd5");
    },
});
