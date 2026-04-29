// ./Commands/Feedbacks.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Feedbacks';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const fidOpt  = (o) => o.setName('feedback_id').setDescription('Feedback ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('feedbacks')
  .setDescription('[Owner] SellAuth — manage feedbacks')

  .addSubcommand(s => s.setName('list').setDescription('List feedbacks')
    .addIntegerOption(o => o.setName('rating').setDescription('Filter by rating').setMinValue(1).setMaxValue(5))
    .addStringOption(o => o.setName('statuses').setDescription('CSV statuses'))
    .addBooleanOption(o => o.setName('has_reply').setDescription('Already replied?'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one feedback')
    .addStringOption(fidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('reply').setDescription('Reply to a feedback')
    .addStringOption(fidOpt)
    .addStringOption(o => o.setName('reply').setDescription('Reply content').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('dispute').setDescription('Dispute a feedback')
    .addStringOption(fidOpt)
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete-auto').setDescription('Delete all automatic feedbacks')
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const statusesRaw = interaction.options.getString('statuses');
    const params = qs(
      ['rating',    interaction.options.getInteger('rating')],
      ['statuses',  statusesRaw ? statusesRaw.split(',').map(s => s.trim()) : null],
      ['has_reply', interaction.options.getBoolean('has_reply')],
      ['page',      interaction.options.getInteger('page')],
      ['perPage',   interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/feedbacks`,
      params,
      title:    `Feedbacks — shop ${sid}`,
      row: (f, i) => ({
        name:  `\`${i+1}.\` ${'⭐'.repeat(f.rating ?? 0) || '?'} — \`${f.id}\``,
        value: [
          `> Status: \`${f.status ?? '-'}\``,
          `> Reply: \`${f.reply ? 'yes' : 'no'}\``,
          `> Created: ${Row.rel(f.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'delete-auto') {
    return runApi(ctx, () => sa.post(`/shops/${sid}/feedbacks/delete-automatic`, {}), {
      title: 'Delete automatic', render: (p) => renderOk(ctx, { title: 'Automatic feedbacks deleted', data: p }),
    });
  }

  const fid = interaction.options.getString('feedback_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/feedbacks/${fid}`), {
      title: 'Feedback', render: (p) => renderItem(ctx, p, { title: `Feedback \`${fid}\``, showRaw: true }),
    });
  }
  if (sub === 'reply') {
    const body = { reply: interaction.options.getString('reply') };
    return runApi(ctx, () => sa.post(`/shops/${sid}/feedbacks/${fid}/reply`, body), {
      title: 'Reply', render: (p) => renderOk(ctx, { title: 'Reply sent', data: p }),
    });
  }
  if (sub === 'dispute') {
    const body = { reason: interaction.options.getString('reason') };
    return runApi(ctx, () => sa.post(`/shops/${sid}/feedbacks/${fid}/dispute`, body), {
      title: 'Dispute', render: (p) => renderOk(ctx, { title: 'Dispute filed', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
