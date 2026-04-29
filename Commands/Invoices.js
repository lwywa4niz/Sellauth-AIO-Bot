// ./Commands/Invoices.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Invoices';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const iidOpt  = (o) => o.setName('invoice_id').setDescription('Invoice ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('invoices')
  .setDescription('[Owner] SellAuth — manage invoices')

  .addSubcommand(s => s.setName('list').setDescription('List invoices')
    .addStringOption(o => o.setName('email').setDescription('Filter by email'))
    .addStringOption(o => o.setName('statuses').setDescription('CSV statuses (paid,pending,...)'))
    .addStringOption(o => o.setName('start').setDescription('created_at_start (ISO)'))
    .addStringOption(o => o.setName('end').setDescription('created_at_end (ISO)'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('archive').setDescription('Archive an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('unarchive').setDescription('Unarchive an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('cancel').setDescription('Cancel an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('refund').setDescription('Refund an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('unrefund').setDescription('Unrefund an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('note').setDescription('Update dashboard note')
    .addStringOption(iidOpt)
    .addStringOption(o => o.setName('note').setDescription('Note content').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('pdf').setDescription('Get PDF URL / binary')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('process').setDescription('Process an invoice')
    .addStringOption(iidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('replace-delivered').setDescription('Replace delivered items')
    .addStringOption(iidOpt)
    .addStringOption(o => o.setName('invoice_item_id').setDescription('Invoice item ID').setRequired(true))
    .addStringOption(o => o.setName('replacements').setDescription('JSON array or string').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const statusesRaw = interaction.options.getString('statuses');
    const params = qs(
      ['email',              interaction.options.getString('email')],
      ['statuses',           statusesRaw ? statusesRaw.split(',').map(s => s.trim()) : null],
      ['created_at_start',   interaction.options.getString('start')],
      ['created_at_end',     interaction.options.getString('end')],
      ['page',               interaction.options.getInteger('page')],
      ['perPage',            interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/invoices`,
      params,
      title:    `Invoices — shop ${sid}`,
      row: (inv, i) => ({
        name:  `\`${i+1}.\` ${inv.email ?? '?'} — \`${inv.id}\``,
        value: [
          `> Status: \`${inv.status ?? '-'}\``,
          `> Total: \`${inv.total ?? inv.amount ?? '-'}\``,
          `> Created: ${Row.rel(inv.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  const iid = interaction.options.getString('invoice_id');

  const simple = {
    'get':       () => sa.get(`/shops/${sid}/invoices/${iid}`),
    'archive':   () => sa.post(`/shops/${sid}/invoices/${iid}/archive`,   {}),
    'unarchive': () => sa.post(`/shops/${sid}/invoices/${iid}/unarchive`, {}),
    'cancel':    () => sa.post(`/shops/${sid}/invoices/${iid}/cancel`,    {}),
    'refund':    () => sa.post(`/shops/${sid}/invoices/${iid}/refund`,    {}),
    'unrefund':  () => sa.post(`/shops/${sid}/invoices/${iid}/unrefund`,  {}),
    'pdf':       () => sa.get(`/shops/${sid}/invoices/${iid}/pdf`),
    'process':   () => sa.get(`/shops/${sid}/invoices/${iid}/process`),
  };
  if (simple[sub]) {
    return runApi(ctx, simple[sub], {
      title: `Invoice ${sub}`,
      render: (p) => sub === 'get'
        ? renderItem(ctx, p, { title: `Invoice \`${iid}\``, showRaw: true })
        : renderOk(ctx, { title: `Invoice ${sub} done`, data: p }),
    });
  }

  if (sub === 'note') {
    const body = { note: interaction.options.getString('note') };
    return runApi(ctx, () => sa.put(`/shops/${sid}/invoices/${iid}/dashboard-note`, body), {
      title: 'Note', render: (p) => renderOk(ctx, { title: 'Note updated', data: p }),
    });
  }
  if (sub === 'replace-delivered') {
    const itemId = interaction.options.getString('invoice_item_id');
    let replacements = interaction.options.getString('replacements');
    try { replacements = JSON.parse(replacements); } catch { /* keep as string */ }
    return runApi(ctx, () => sa.post(`/shops/${sid}/invoices/${iid}/replace-delivered`, {
      invoice_item_id: itemId, replacements,
    }), {
      title: 'Replace delivered', render: (p) => renderOk(ctx, { title: 'Delivered items replaced', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
