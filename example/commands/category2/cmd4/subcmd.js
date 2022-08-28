module.exports = {
    enabled: true,
    description: "description for cmd4 > subcmd",
    options: [],

    async callback(interaction) {
        await interaction.reply("Response for cmd4 > subcmd");
    },
};
