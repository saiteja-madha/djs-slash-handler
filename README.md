# About

Command handler for discord.js v14 subcommands and subcommand groups.
It will use the file structure to create the corresponding subcommands and subcommand groups.

## Installation

```bash
npm install djs-v14-handler
```

## Working

Below is an example of how command handler interprets the file structure. The folder/file names are the names of the subcommands/subcommand groups.

```
commands
    |
    |__ category1
        |
        |__ command1.js
        |
        |__ command2.js
    |
    |__ category2
        |
        |__ command3
            |__ subcommand1.js
            |__ subcommand2.js
        |
        |__ command4
            |__ subcommandgroup
                |__ subcommand1.js
                |__ subcommand2.js
            |__ subcommand1.js
            |__ subcommand2.js
```

Refer to the [discord developer documentation](https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups) for more information on valid/invalid structure

## Additional Info

-   This is a quick & dirty implementation of the command handler
-   Additional features/documentation will be added in the future
-   Feel free to contribute to this project and open an issue if you find any bugs
-   For more information on how to use the command handler, join us on discord [here](https://discord.gg/BZFH4RSf2u)
