module.exports = {
    enabled: true,
    description: "description for cmd4 > subcommandgroup> subcmd1",
    options: [],

    async callback(interaction) {
        await interaction.reply("Response for cmd4 > subcommandgroup> subcmd1");
    },
};
