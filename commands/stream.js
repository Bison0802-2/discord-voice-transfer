"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const AudioMixer = __importStar(require("audio-mixer"));
const discord_js_1 = require("discord.js");
const Prism = __importStar(require("prism-media"));
const autoCompleteChannels_1 = require("../components/autoCompleteChannels");
// process.on("warning", (e) => console.warn(e.stack));
const deleteMixerListeners = (mixer) => {
    mixer.removeAllListeners("end");
    mixer.removeAllListeners("finish");
    mixer.removeAllListeners("close");
    mixer.removeAllListeners("error");
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("stream")
        .setDescription("VCを中継。")
        .addChannelOption((option) => option
        .setName("聞きたいチャンネル")
        .setDescription("The channel that Listener-bot join")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice))
        .addChannelOption((option) => option
        .setName("音声を流すチャンネル")
        .setDescription("The channel that Speaker-bot join")
        .setRequired(true)
        .addChannelTypes(discord_js_1.ChannelType.GuildVoice)),
    async autocomplete(interaction) {
        await (0, autoCompleteChannels_1.autoCompleteChannels)(interaction);
    },
    async execute(interaction, listenerClient, speakerClient) {
        const voiceChannel1 = interaction.options.getChannel("聞きたいチャンネル");
        const voiceChannel2 = interaction.options.getChannel("音声を流すチャンネル");
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
            const listenerVoiceAdapterCreator = listenerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;
            const speakerVoiceAdapterCreator2 = speakerClient.guilds.cache.get(guildId)?.voiceAdapterCreator;
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
            const listenerConnection = (0, voice_1.joinVoiceChannel)({
                group: "listener",
                guildId: guildId,
                channelId: voiceChannel1.id,
                adapterCreator: listenerVoiceAdapterCreator,
                selfMute: true,
                selfDeaf: false,
            });
            const speakerConnection = (0, voice_1.joinVoiceChannel)({
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
            const handleSpeaking = (userId) => {
                const player = (0, voice_1.createAudioPlayer)({
                    behaviors: {
                        noSubscriber: voice_1.NoSubscriberBehavior.Play,
                    },
                });
                speakerConnection.subscribe(player);
                const resource = (0, voice_1.createAudioResource)(mixer, {
                    inputType: voice_1.StreamType.Raw,
                });
                player.play(resource);
                const audioStream = listenerConnection.receiver.subscribe(userId, {
                    end: {
                        behavior: voice_1.EndBehaviorType.AfterInactivity,
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
        }
        else {
            await interaction.reply({
                content: "BOTを参加させるVCを指定してください！",
                ephemeral: true,
            });
        }
    },
};
