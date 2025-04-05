import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong!と返信。"),
  async execute(interaction: CommandInteraction) {
    await interaction.reply({
      content: "Pong!",
      ephemeral: true,
    });
  },
};
