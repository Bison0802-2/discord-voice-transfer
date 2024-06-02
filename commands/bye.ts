import { VoiceConnection } from "@discordjs/voice";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bye")
    .setDescription("Disconnect voice channel!"),
  async execute(
    interaction: ChatInputCommandInteraction,
    connections: VoiceConnection[]
  ) {
    if (connections === undefined) {
      await interaction.reply(
        "LISTNER, SPEAKER bot が VC に参加していません。"
      );
      return;
    } else {
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
