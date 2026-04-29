// ./Interactions/Paginate.js
//
// Handles ◀/▶ buttons emitted by runListApi. Re-runs the original endpoint
// with a new `page` and updates the message in place.

import { MessageFlags } from 'discord.js';
import { sa }           from '../Utils/SellAuth.js';
import { Log }          from '../Utils/Logger.js';
import {
  getSession, buildPageButtons, buildListEmbed,
  pickRows, pickMeta,
} from '../Utils/ApiCommand.js';

export const customIdPrefix = 'pg:';
export const type           = 'button';

export async function execute(interaction) {
  const [, sessionId, dir] = interaction.customId.split(':');

  // Indicator button — never actually pressable but defer just in case.
  if (dir === 'noop') {
    return interaction.deferUpdate().catch(() => {});
  }

  const session = getSession(sessionId);
  if (!session) {
    return interaction.reply({
      content: '⌛ Session expired. Please run the command again.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  if (interaction.user.id !== session.userId) {
    return interaction.reply({
      content: '🚫 You are not the owner of this session.',
      flags:   MessageFlags.Ephemeral,
    });
  }

  await interaction.deferUpdate().catch(() => {});

  const targetPage = dir === 'next' ? session.page + 1 : session.page - 1;
  const newPage    = Math.max(1, Math.min(targetPage, session.totalPages || targetPage));
  if (newPage === session.page) return;

  try {
    const payload = await sa.get(session.endpoint, { params: { ...session.baseParams, page: newPage } });
    const rows    = pickRows(payload);
    const meta    = pickMeta(payload);
    const totalPages = meta?.last_page ?? session.totalPages;

    session.page = newPage;
    session.totalPages = totalPages;

    const embed = buildListEmbed({
      rows, meta, page: newPage,
      title: session.title, row: session.row, empty: session.empty,
      limit: session.limit ?? 15,
      user:  interaction.user,
    });
    const buttons    = buildPageButtons(sessionId, newPage, totalPages);
    const components = buttons ? [buttons] : [];

    await interaction.editReply({ embeds: [embed], components });
  } catch (err) {
    Log.Warn(`[paginate] ${err.message}`);
    try {
      await interaction.followUp({
        content: `❌ Failed to load page: \`${err.message}\``,
        flags:   MessageFlags.Ephemeral,
      });
    } catch {}
  }
}

export default { customIdPrefix, type, execute };
