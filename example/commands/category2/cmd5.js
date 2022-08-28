module.exports = {
    enabled: true,
    description: "description for cmd5",
    options: [],

    async callback(interaction) {
        await interaction.reply("Response for cmd5");
    },
};
