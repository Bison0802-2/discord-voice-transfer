"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        // コマンドの名前
        .setName("play")
        // コマンドの説明文
        .setDescription("VCで音楽を流します。"),
    async execute(interaction, connection) {
        const resource = (0, voice_1.createAudioResource)("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", {
            inputType: voice_1.StreamType.Arbitrary,
        });
        const player = (0, voice_1.createAudioPlayer)({
            behaviors: {
                noSubscriber: voice_1.NoSubscriberBehavior.Pause,
            },
        });
        player.play(resource);
        const status = ["●Loading Sounds...", "●Connecting to VC..."];
        const p = interaction.reply(status.join("\n"));
        const promises = [];
        promises.push((0, voice_1.entersState)(player, voice_1.AudioPlayerStatus.AutoPaused, 1000 * 10).then(() => (status[0] += "Done!")));
        promises.push((0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 1000 * 10).then(() => (status[1] += "Done!")));
        await Promise.race(promises);
        await p;
        await Promise.all([...promises, interaction.editReply(status.join("\n"))]);
        connection.subscribe(player);
        await (0, voice_1.entersState)(player, voice_1.AudioPlayerStatus.Playing, 100);
        await interaction.editReply("Playing");
        await (0, voice_1.entersState)(player, voice_1.AudioPlayerStatus.Idle, 2 ** 31 - 1);
        await interaction.editReply("End");
    },
};
