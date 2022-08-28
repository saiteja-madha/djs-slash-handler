module.exports = {
    enabled: true,
    description: "description for cmd1",
    options: [],

    async callback(interaction, data) {
        await interaction.reply("Response for cmd1");
    },
};
