import {
  AutocompleteInteraction,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
} from "discord.js";

import { joinVoiceChannel } from "@discordjs/voice";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autocomplete")
    .setDescription("autocomplete")
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
        // .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    ),
  async autocomplete(interaction: AutocompleteInteraction<CacheType>) {
    const focusedValue = interaction.options.getFocused();
    const vc = interaction.options.get("channel1");
    const chats = interaction.guild?.channels.cache;
    const voiceChannels = chats?.filter((file) => file.type === 2);
    let unSelectedVoiceChannels = [];
    if (!voiceChannels || !vc) {
      return;
    }
    for (const voiceChannel of voiceChannels) {
      if (voiceChannel[0] !== vc.value) {
        unSelectedVoiceChannels.push(voiceChannel);
      }
    }
    const filtered = unSelectedVoiceChannels.filter((unSelectedVoiceChannel) =>
      unSelectedVoiceChannel[1].name.startsWith(focusedValue)
    );
    await interaction.respond(
      filtered
        .map((unSelectedVoiceChannel) => ({
          name: unSelectedVoiceChannel[1].name,
          value: unSelectedVoiceChannel[1].id,
        }))
        .slice(0, 25)
    );
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
    }
  },
};
