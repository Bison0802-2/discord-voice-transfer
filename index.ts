import fs from "node:fs";
import path from "node:path";

import { VoiceConnection } from "@discordjs/voice";
import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { LISTENER, SPEAKER } from "./config.json";

type hasExecute = {
  data: {
    name: string;
    description: string;
  };
  execute: Function;
  autocomplete?: Function;
};

const client1 = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
const client2 = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

let connections: VoiceConnection[] = [];
// 今回はListenner-botに対してのみコマンドを割り当ててみる。
const listenerCommands = new Collection();

// commandsフォルダから、.jsで終わるファイルのみを取得
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // 取得した.jsファイル内の情報から、コマンドと名前をListenner-botに対して設定
  if ("data" in command && "execute" in command) {
    listenerCommands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING]  ${filePath} のコマンドには、必要な "data" または "execute" プロパティがありません。`
    );
  }
}

// コマンドが送られてきた際の処理
client1.on(Events.InteractionCreate, async (interaction) => {
  // コマンドでなかった場合は処理せずさよなら。
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
    return;

  const command = listenerCommands.get(interaction.commandName) as hasExecute;

  // 一致するコマンドがなかった場合
  if (!command) {
    console.error(` ${interaction.commandName} というコマンドは存在しません。`);
    return;
  }

  try {
    // コマンドを実行
    if (
      interaction.commandName === "join" ||
      interaction.commandName === "stream" ||
      interaction.commandName === "autocomplete"
    ) {
      connections = await command.execute(interaction, client1, client2);
    } else if (interaction.commandName === "record") {
      await command.execute(interaction, connections[0]);
    } else if (interaction.commandName === "play") {
      await command.execute(interaction, connections[1]);
    } else if (interaction.commandName === "bye") {
      await command.execute(interaction, connections);
    } else {
      await command.execute(interaction);
    }
    if (interaction.isAutocomplete()) {
      if (command.autocomplete) await command.autocomplete(interaction);
    }
  } catch (error) {
    console.error(error);
    if ("reply" in interaction) {
      await interaction.reply({
        content: "コマンドを実行中にエラーが発生しました。",
        ephemeral: true,
      });
    }
  }
});

client1.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client2.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client1.login(LISTENER.TOKEN);
client2.login(SPEAKER.TOKEN);
