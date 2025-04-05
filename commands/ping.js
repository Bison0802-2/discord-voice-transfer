"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
module.exports = {
    data: new builders_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!と返信。"),
    async execute(interaction) {
        await interaction.reply({
            content: "Pong!",
            ephemeral: true,
        });
    },
};
