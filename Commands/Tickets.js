// ./Commands/Tickets.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Tickets';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const tidOpt  = (o) => o.setName('ticket_id').setDescription('Ticket ID').setRequired(true).setAutocomplete(true);
const cusOpt  = (o) => o.setName('customer_id').setDescription('Customer ID').setRequired(true).setAutocomplete(true);
const invOpt  = (o) => o.setName('invoice_id').setDescription('Linked invoice ID').setRequired(false).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('tickets')
  .setDescription('[Owner] SellAuth — manage tickets')

  .addSubcommand(s => s.setName('list').setDescription('List tickets')
    .addStringOption(o => o.setName('email').setDescription('Filter by customer email'))
    .addStringOption(o => o.setName('statuses').setDescription('CSV statuses'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one ticket')
    .addStringOption(tidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a ticket')
    .addStringOption(cusOpt)
    .addStringOption(o => o.setName('subject').setDescription('Subject').setRequired(true))
    .addStringOption(invOpt)
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('close').setDescription('Close a ticket')
    .addStringOption(tidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('reopen').setDescription('Reopen a ticket')
    .addStringOption(tidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('archive').setDescription('Archive a ticket')
    .addStringOption(tidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('unarchive').setDescription('Unarchive a ticket')
    .addStringOption(tidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('message').setDescription('Send a message to a ticket')
    .addStringOption(tidOpt)
    .addStringOption(o => o.setName('content').setDescription('Content (max 8000)').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete-message').setDescription('Delete a ticket message')
    .addStringOption(tidOpt)
    .addStringOption(o => o.setName('message_id').setDescription('Message ID').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const statusesRaw = interaction.options.getString('statuses');
    const params = qs(
      ['customer_email', interaction.options.getString('email')],
      ['statuses',       statusesRaw ? statusesRaw.split(',').map(s => s.trim()) : null],
      ['page',           interaction.options.getInteger('page')],
      ['perPage',        interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/tickets`,
      params,
      title:    `Tickets — shop ${sid}`,
      row: (t, i) => ({
        name:  `\`${i+1}.\` ${t.subject ?? '?'} — \`${t.id}\``,
        value: [
          `> Status: \`${t.status ?? '-'}\``,
          `> Customer: \`${t.customer_email ?? t.customer?.email ?? '-'}\``,
          `> Created: ${Row.rel(t.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'create') {
    const body = {
      customer_id: interaction.options.getString('customer_id'),
      subject:     interaction.options.getString('subject'),
      invoice_id:  interaction.options.getString('invoice_id') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/tickets`, body), {
      title: 'Create ticket', render: (p) => renderOk(ctx, { title: 'Ticket created', data: p }),
    });
  }

  const tid = interaction.options.getString('ticket_id');

  const simple = {
    'get':       () => sa.get(`/shops/${sid}/tickets/${tid}`),
    'close':     () => sa.post(`/shops/${sid}/tickets/${tid}/close`,     {}),
    'reopen':    () => sa.post(`/shops/${sid}/tickets/${tid}/reopen`,    {}),
    'archive':   () => sa.post(`/shops/${sid}/tickets/${tid}/archive`,   {}),
    'unarchive': () => sa.post(`/shops/${sid}/tickets/${tid}/unarchive`, {}),
  };
  if (simple[sub]) {
    return runApi(ctx, simple[sub], {
      title: `Ticket ${sub}`,
      render: (p) => sub === 'get'
        ? renderItem(ctx, p, { title: `Ticket \`${tid}\``, showRaw: true })
        : renderOk(ctx, { title: `Ticket ${sub} done`, data: p }),
    });
  }

  if (sub === 'message') {
    const body = { content: interaction.options.getString('content') };
    return runApi(ctx, () => sa.post(`/shops/${sid}/tickets/${tid}/messages`, body), {
      title: 'Send message', render: (p) => renderOk(ctx, { title: 'Message sent', data: p }),
    });
  }
  if (sub === 'delete-message') {
    const mid = interaction.options.getString('message_id');
    return runApi(ctx, () => sa.delete(`/shops/${sid}/tickets/${tid}/messages/${mid}`), {
      title: 'Delete message', render: (p) => renderOk(ctx, { title: 'Message deleted', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
