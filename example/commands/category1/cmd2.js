module.exports = {
    enabled: true,
    description: "description for cmd2",
    options: [],

    async callback(interaction) {
        await interaction.reply("Response for cmd2");
    },
};
