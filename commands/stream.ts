import {
  createAudioPlayer,
  createAudioResource,
  EndBehaviorType,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";
import * as AudioMixer from "audio-mixer";
import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
} from "discord.js";
import * as Prism from "prism-media";
import { Readable } from "stream";
import { autoCompleteChannels } from "../components/autoCompleteChannels";

// process.on("warning", (e) => console.warn(e.stack));

const deleteMixerListeners = (mixer: AudioMixer.Mixer) => {
  mixer.removeAllListeners("end");
  mixer.removeAllListeners("finish");
  mixer.removeAllListeners("close");
  mixer.removeAllListeners("error");
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stream")
    .setDescription("VCを中継。")
    .addChannelOption((option) =>
      option
        .setName("聞きたいチャンネル")
        .setDescription("The channel that Listener-bot join")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildVoice)
    )
    .addChannelOption((option) =>
      option
        .setName("音声を流すチャンネル")
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
    const voiceChannel1 = interaction.options.getChannel("聞きたいチャンネル");
    const voiceChannel2 =
      interaction.options.getChannel("音声を流すチャンネル");
    if (voiceChannel1 && voiceChannel2) {
      if (voiceChannel1 === voiceChannel2) {
        await interaction.reply({
          content: "同じ VC に参加することはできません🥺",
          ephemeral: true,
        });
        return;
      }
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply({
          content: "このコマンドはサーバー内でのみ使用できます。",
          ephemeral: true,
        });
        return;
      }

      const listenerVoiceAdapterCreator =
        listenerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;
      const speakerVoiceAdapterCreator2 =
        speakerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;

      if (!listenerVoiceAdapterCreator) {
        await interaction.reply({
          content: "Listener-botがこのサーバーに参加していません。",
          ephemeral: true,
        });
        return;
      }
      if (!speakerVoiceAdapterCreator2) {
        await interaction.reply({
          content: "Speaker-botがこのサーバーに参加していません。",
          ephemeral: true,
        });
        return;
      }

      const listenerConnection = joinVoiceChannel({
        group: "listener",
        guildId: guildId,
        channelId: voiceChannel1.id,
        adapterCreator: listenerVoiceAdapterCreator,
        selfMute: true,
        selfDeaf: false,
      });
      const speakerConnection = joinVoiceChannel({
        group: "speaker",
        guildId: guildId,
        channelId: voiceChannel2.id,
        adapterCreator: speakerVoiceAdapterCreator2,
        selfMute: false,
        selfDeaf: true,
      });
      const mixer = new AudioMixer.Mixer({
        channels: 2,
        bitDepth: 16,
        sampleRate: 48000,
      });
      const handleSpeaking = (userId: string) => {
        const player = createAudioPlayer({
          behaviors: {
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });
        speakerConnection.subscribe(player);
        const resource = createAudioResource(mixer as unknown as Readable, {
          inputType: StreamType.Raw,
        });
        player.play(resource);

        const audioStream = listenerConnection.receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterInactivity,
            duration: 50,
          },
        });
        const standaloneInput = new AudioMixer.Input({
          channels: 2,
          bitDepth: 16,
          sampleRate: 48000,
          volume: 100,
        });
        mixer.addInput(standaloneInput);

        const opus_decoder = new Prism.opus.Decoder({
          rate: 48000,
          channels: 2,
          frameSize: 960,
        });
        const p = audioStream.pipe(opus_decoder).pipe(standaloneInput);
        deleteMixerListeners(mixer);

        audioStream.on("end", () => {
          if (mixer != null) {
            mixer.removeInput(standaloneInput);
            opus_decoder.destroy();
            standaloneInput.destroy();
            audioStream.destroy();
            p.destroy();
          }
        });
      };

      listenerConnection.receiver.speaking.on("start", handleSpeaking);

      await interaction.reply({ content: "VCを中継します！", ephemeral: true });
      return [listenerConnection, speakerConnection];
    } else {
      await interaction.reply({
        content: "BOTを参加させるVCを指定してください！",
        ephemeral: true,
      });
    }
  },
};
