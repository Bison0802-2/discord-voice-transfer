"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fastify_1 = __importDefault(require("fastify"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const LISTENER_TOKEN = process.env.LISTENER_TOKEN;
const SPEAKER_TOKEN = process.env.SPEAKER_TOKEN;
if (!LISTENER_TOKEN) {
    console.error("LISTENER_TOKEN is not set.");
    process.exit(1);
}
if (!SPEAKER_TOKEN) {
    console.error("SPEAKER_TOKEN is not set.");
    process.exit(1);
}
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
client1.login(LISTENER_TOKEN);
client2.login(SPEAKER_TOKEN);
const server = (0, fastify_1.default)({
    logger: true,
});
server.get("/", async (request, reply) => {
    return { hello: "world" };
});
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 8000;
        const address = await server.listen({ port, host: "0.0.0.0" });
        server.log.info(`server listening on ${address}`);
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();
