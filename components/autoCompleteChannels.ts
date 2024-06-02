import { AutocompleteInteraction } from "discord.js";

export async function autoCompleteChannels(
  interaction: AutocompleteInteraction
) {
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
}
