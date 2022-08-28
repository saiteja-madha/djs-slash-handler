module.exports = {
    enabled: true,
    description: "description for cmd3 > subcmd1",
    options: [],

    async callback(interaction) {
        await interaction.reply("Response for cmd3 > subcmd1");
    },
};
