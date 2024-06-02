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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stream")
    .setDescription("VCを中継。")
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
      const mixer = new AudioMixer.Mixer({
        channels: 2,
        bitDepth: 16,
        sampleRate: 48000,
        // clearInterval: 250,
      });
      // Listener-botが参加しているVCで誰かが話し出したら実行
      connection1.receiver.speaking.on("start", (userId) => {
        const audioStream = connection1.receiver.subscribe(userId, {
          end: {
            behavior: EndBehaviorType.AfterSilence,
            // Opusの場合、100msだと短過ぎるのか、エラー落ちするため1000msに設定
            // Rawに変換する場合、1000msだと長過ぎるのか、エラー落ちするため100msに設定
            duration: 100,
          },
        });
        const standaloneInput = new AudioMixer.Input({
          channels: 2,
          bitDepth: 16,
          sampleRate: 48000,
          volume: 100,
        });
        const audioMixer = mixer;
        audioMixer.addInput(standaloneInput);
        // VCの音声取得機能

        const opus_decoder = new Prism.opus.Decoder({
          rate: 48000,
          channels: 2,
          frameSize: 960,
        });
        const p = audioStream.pipe(opus_decoder).pipe(standaloneInput);
        // 音声をVCに流す機能
        const player = createAudioPlayer({
          behaviors: {
            // 聞いている人がいなくても音声を中継してくれるように設定
            noSubscriber: NoSubscriberBehavior.Play,
          },
        });
        const resource = createAudioResource(mixer as unknown as Readable, {
          // VCから取得してきた音声はOpus型なので、Opusに設定
          inputType: StreamType.Raw,
        });
        player.play(resource);
        connection2.subscribe(player);
        audioStream.on("end", () => {
          if (this.audioMixer != null) {
            this.audioMixer.removeInput(standaloneInput);
            opus_decoder.destroy();
            standaloneInput.destroy();
            audioStream.destroy();
            p.destroy();
          }
        });
      });
      await interaction.reply("VCを中継します！");
    } else {
      await interaction.reply("BOTを参加させるVCを指定してください！");
    }
  },
};
