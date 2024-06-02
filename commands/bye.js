"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("bye")
        .setDescription("Disconnect voice channel!"),
    async execute(interaction, connections) {
        if (connections === undefined) {
            await interaction.reply("LISTNER, SPEAKER bot が VC に参加していません。");
            return;
        }
        else {
            for (const connection of connections) {
                if (connection !== undefined) {
                    connection.destroy();
                }
            }
            await interaction.reply("Bye bot!");
            return;
        }
    },
};
