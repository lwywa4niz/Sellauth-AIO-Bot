// ./Commands/Customers.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Customers';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const cidOpt  = (o) => o.setName('customer_id').setDescription('Customer ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('customers')
  .setDescription('[Owner] SellAuth — manage customers')

  .addSubcommand(s => s.setName('list').setDescription('List customers')
    .addStringOption(o => o.setName('email').setDescription('Filter by email'))
    .addStringOption(o => o.setName('discord_id').setDescription('Filter by Discord ID'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one customer')
    .addStringOption(cidOpt)
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('balance-tx').setDescription('Customer balance history')
    .addStringOption(cidOpt)
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('balance-add').setDescription('Add / subtract balance (POST)')
    .addStringOption(cidOpt)
    .addNumberOption(o => o.setName('amount').setDescription('Amount (negative to subtract)').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description').setRequired(false))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('balance-set').setDescription('Set balance (PUT)')
    .addStringOption(cidOpt)
    .addNumberOption(o => o.setName('amount').setDescription('New amount').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Description').setRequired(false))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('affiliate').setDescription('Change affiliate code')
    .addStringOption(cidOpt)
    .addStringOption(o => o.setName('affiliate_code').setDescription('New affiliate code').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const params = qs(
      ['email',      interaction.options.getString('email')],
      ['discord_id', interaction.options.getString('discord_id')],
      ['page',       interaction.options.getInteger('page')],
      ['perPage',    interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/customers`,
      params,
      title:    `Customers — shop ${sid}`,
      row: (c, i) => ({
        name:  `\`${i+1}.\` ${c.email ?? '?'} — \`${c.id}\``,
        value: [
          `> Discord: \`${c.discord_id ?? '-'}\``,
          `> Balance: \`${c.balance ?? '0'}\``,
          `> Created: ${Row.rel(c.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  const cid = interaction.options.getString('customer_id');

  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/customers/${cid}`), {
      title: 'Customer',
      render: (p) => renderItem(ctx, p, { title: `Customer \`${cid}\``, showRaw: true }),
    });
  }
  if (sub === 'balance-tx') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/customers/${cid}/balance-transactions`,
      title:    `Balance — customer ${cid}`,
      row: (t, i) => ({
        name:  `\`${i+1}.\` ${t.amount ?? '?'}`,
        value: [
          `> ${t.description ?? '-'}`,
          `> ${Row.rel(t.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }
  if (sub === 'balance-add') {
    const body = {
      amount:      interaction.options.getNumber('amount'),
      description: interaction.options.getString('description') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/customers/${cid}/balance`, body), {
      title: 'Balance add', render: (p) => renderOk(ctx, { title: 'Balance adjusted', data: p }),
    });
  }
  if (sub === 'balance-set') {
    const body = {
      amount:      interaction.options.getNumber('amount'),
      description: interaction.options.getString('description') ?? undefined,
    };
    return runApi(ctx, () => sa.put(`/shops/${sid}/customers/${cid}/balance`, body), {
      title: 'Balance set', render: (p) => renderOk(ctx, { title: 'Balance set', data: p }),
    });
  }
  if (sub === 'affiliate') {
    const body = { affiliate_code: interaction.options.getString('affiliate_code') };
    return runApi(ctx, () => sa.put(`/shops/${sid}/customers/${cid}/affiliate-code`, body), {
      title: 'Affiliate code', render: (p) => renderOk(ctx, { title: 'Affiliate code updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
