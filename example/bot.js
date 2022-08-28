const Discord = require("discord.js");
const CommandHandler = require("djs-v14-handler");

// initialize discord client
const client = new Discord.Client({
    intents: ["Guilds"],
});

// initialize the command handler
const cmdHandler = new CommandHandler({
    path: "commands",
    disabledCategories: [],
});

client.login("YOUR_BOT_TOKEN").then(() => {
    client.on("ready", async () => {
        console.log("Client is ready");

        // register slash commands
        const json = cmdHandler.getCommandsJSON();
        await client.guilds.cache.get("GUILD_TO_REGISTER_INTERACTIONS").commands.set(json);
        console.log("interactions registered");
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
            // handle interaction
            cmdHandler.handleInteraction(interaction);
        }
    });
});
