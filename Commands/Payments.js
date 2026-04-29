// ./Commands/Payments.js

import { SlashCommandBuilder }                      from 'discord.js';
import { ctxFromInteraction }                       from '../Utils/Commands.js';
import { sa, resolveShopId }                        from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk } from '../Utils/ApiCommand.js';
import { guardSuperUser }                           from '../Utils/Permissions.js';
import { handleAutocomplete }                       from '../Utils/Autocomplete.js';

export const category = 'Payment Methods';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const midOpt  = (o) => o.setName('method_id').setDescription('Payment method ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('payments')
  .setDescription('[Owner] SellAuth — payment methods')

  .addSubcommand(s => s.setName('list').setDescription('List payment methods').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one payment method')
    .addStringOption(midOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a payment method')
    .addStringOption(o => o.setName('type').setDescription('Type').setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('Display name').setRequired(true))
    .addStringOption(o => o.setName('body').setDescription('Extra JSON body'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a payment method')
    .addStringOption(midOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a payment method')
    .addStringOption(midOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('toggle').setDescription('Enable / disable a payment method')
    .addStringOption(midOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('reorder').setDescription('Reorder payment methods')
    .addStringOption(o => o.setName('payment_methods').setDescription('JSON array').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/payment-methods`,
      title:    `Payment methods — shop ${sid}`,
      row: (m, i) => ({
        name:  `\`${i+1}.\` ${m.name ?? '?'} — \`${m.id}\``,
        value: `> Type: \`${m.type ?? '-'}\`\n> Enabled: \`${m.enabled ? 'yes' : 'no'}\``,
        inline: true,
      }),
    });
  }
  if (sub === 'reorder') {
    let pms;
    try { pms = JSON.parse(interaction.options.getString('payment_methods')); }
    catch { throw new Error('payment_methods must be a JSON array.'); }
    return runApi(ctx, () => sa.put(`/shops/${sid}/payment-methods/order`, { paymentMethods: pms }), {
      title: 'Reorder', render: (p) => renderOk(ctx, { title: 'Reordered', data: p }),
    });
  }
  if (sub === 'create') {
    let extra = {};
    const raw = interaction.options.getString('body');
    if (raw) {
      try { extra = JSON.parse(raw); } catch { throw new Error('Invalid JSON body.'); }
    }
    const body = {
      type: interaction.options.getString('type'),
      name: interaction.options.getString('name'),
      ...extra,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/payment-methods`, body), {
      title: 'Create method', render: (p) => renderOk(ctx, { title: 'Payment method created', data: p }),
    });
  }

  const mid = interaction.options.getString('method_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/payment-methods/${mid}`), {
      title: 'Payment method', render: (p) => renderItem(ctx, p, { title: `Method \`${mid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/payment-methods/${mid}`), {
      title: 'Delete method', render: (p) => renderOk(ctx, { title: 'Payment method deleted', data: p }),
    });
  }
  if (sub === 'toggle') {
    return runApi(ctx, () => sa.post(`/shops/${sid}/payment-methods/${mid}/toggle`, {}), {
      title: 'Toggle method', render: (p) => renderOk(ctx, { title: 'Payment method toggled', data: p }),
    });
  }
  if (sub === 'update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    return runApi(ctx, () => sa.put(`/shops/${sid}/payment-methods/${mid}`, body), {
      title: 'Update method', render: (p) => renderOk(ctx, { title: 'Payment method updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
