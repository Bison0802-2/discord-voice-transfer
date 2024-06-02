"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = __importDefault(require("fs"));
const config_json_1 = require("./config.json");
const commands = [];
const commandFiles = fs_1.default
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}
console.log("%o", commands);
// Construct and prepare an instance of the REST module
const rest = new discord_js_1.REST({ version: "10" }).setToken(config_json_1.LISTENER.TOKEN);
// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(discord_js_1.Routes.applicationCommands(config_json_1.LISTENER.CLIENT_ID), { body: commands });
        if (!Array.isArray(data)) {
            throw new Error("data is not an array");
        }
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    }
    catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(error);
    }
})();
