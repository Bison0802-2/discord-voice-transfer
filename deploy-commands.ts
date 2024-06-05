import { REST, Routes } from "discord.js";
import fs from "fs";

const LISTENER_CLIENT_ID = process.env.LISTENER_CLIENT_ID;
const LISTENER_TOKEN = process.env.LISTENER_TOKEN;

if (!LISTENER_CLIENT_ID) {
  console.error("LISTENER_CLIENT_ID is not set.");
  process.exit(1);
}
if (!LISTENER_TOKEN) {
  console.error("LISTENER_TOKEN is not set.");
  process.exit(1);
}

const commands = [];
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}
console.log("%o", commands);

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(LISTENER_TOKEN);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(LISTENER_CLIENT_ID),
      { body: commands }
    );
    if (!Array.isArray(data)) {
      throw new Error("data is not an array");
    }
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
