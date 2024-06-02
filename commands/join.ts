import { joinVoiceChannel } from "@discordjs/voice";
import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
} from "discord.js";
import { autoCompleteChannels } from "../components/autoCompleteChannels";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("VCに参加。")
    .addChannelOption((option) =>
      option
        .setName("channel1")
        .setDescription("The channel that Listener-bot join")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption((option) =>
      option
        .setName("channel2")
        .setDescription("The channel that Speaker-bot join")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    await autoCompleteChannels(interaction);
  },
  async execute(
    interaction: ChatInputCommandInteraction,
    listenerClient: Client,
    speakerClient: Client
  ) {
    const voiceChannel1 = interaction.options.getChannel("channel1");
    const voiceChannel2 = interaction.options.getChannel("channel2");
    if (voiceChannel1 && voiceChannel2) {
      if (voiceChannel1 === voiceChannel2) {
        await interaction.reply("同じ VC には参加できません🥺");
        return;
      }
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply("このコマンドはサーバー内でのみ使用できます。");
        return;
      }

      const listenerVoiceAdapterCreator =
        listenerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;
      const speakerVoiceAdapterCreator2 =
        speakerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;

      if (!listenerVoiceAdapterCreator) {
        await interaction.reply(
          "Listener-botがこのサーバーに参加していません。"
        );
        return;
      }
      if (!speakerVoiceAdapterCreator2) {
        await interaction.reply(
          "Speaker-botがこのサーバーに参加していません。"
        );
        return;
      }

      const connection1 = joinVoiceChannel({
        group: "listener",
        guildId: guildId,
        channelId: voiceChannel1.id,
        adapterCreator: listenerVoiceAdapterCreator,
        selfMute: true,
        selfDeaf: false,
      });
      const connection2 = joinVoiceChannel({
        group: "speaker",
        guildId: guildId,
        channelId: voiceChannel2.id,
        adapterCreator: speakerVoiceAdapterCreator2,
        selfMute: false,
        selfDeaf: true,
      });
      await interaction.reply("VCに参加しました！");
      return [connection1, connection2];
    } else {
      await interaction.reply("BOTを参加させるVCを指定してください！");
    }
  },
};
