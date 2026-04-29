// ./Interactions/HelpSelect.js

import { buildHelp } from '../Commands/Help.js';

export const customId = 'help:select';
export const type     = 'select';

export async function execute(interaction) {
  const selected = interaction.values?.[0] ?? 'overview';
  const payload  = buildHelp(interaction.client, selected, interaction.user);
  return interaction.update({ embeds: payload.embeds, components: payload.components });
}

export default { customId, type, execute };
