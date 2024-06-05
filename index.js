"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const config_json_1 = require("./config.json");
const client1 = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates],
});
const client2 = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildVoiceStates],
});
let connections = [];
// 今回はListenner-botに対してのみコマンドを割り当ててみる。
const listenerCommands = new discord_js_1.Collection();
// commandsフォルダから、.jsで終わるファイルのみを取得
const commandsPath = node_path_1.default.join(__dirname, "commands");
const commandFiles = node_fs_1.default
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const filePath = node_path_1.default.join(commandsPath, file);
    const command = require(filePath);
    // 取得した.jsファイル内の情報から、コマンドと名前をListenner-botに対して設定
    if ("data" in command && "execute" in command) {
        listenerCommands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING]  ${filePath} のコマンドには、必要な "data" または "execute" プロパティがありません。`);
    }
}
// コマンドが送られてきた際の処理
client1.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    // コマンドでなかった場合は処理せずさよなら。
    if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
        return;
    const command = listenerCommands.get(interaction.commandName);
    // 一致するコマンドがなかった場合
    if (!command) {
        console.error(` ${interaction.commandName} というコマンドは存在しません。`);
        return;
    }
    try {
        // コマンドを実行
        if (interaction.commandName === "join" ||
            interaction.commandName === "stream" ||
            interaction.commandName === "autocomplete") {
            connections = await command.execute(interaction, client1, client2);
        }
        else if (interaction.commandName === "record") {
            await command.execute(interaction, connections[0]);
        }
        else if (interaction.commandName === "play") {
            await command.execute(interaction, connections[1]);
        }
        else if (interaction.commandName === "bye") {
            await command.execute(interaction, connections);
        }
        else {
            await command.execute(interaction);
        }
        if (interaction.isAutocomplete()) {
            if (command.autocomplete)
                await command.autocomplete(interaction);
        }
    }
    catch (error) {
        console.error(error);
        if ("reply" in interaction) {
            await interaction.reply({
                content: "コマンドを実行中にエラーが発生しました。",
                ephemeral: true,
            });
        }
    }
});
client1.once(discord_js_1.Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});
client2.once(discord_js_1.Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});
client1.login(config_json_1.LISTENER.TOKEN);
client2.login(config_json_1.SPEAKER.TOKEN);
