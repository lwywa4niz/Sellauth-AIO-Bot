// ./Commands/Coupons.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, resolveShopId, perPage }                    from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Coupons';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const cidOpt  = (o) => o.setName('coupon_id').setDescription('Coupon ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('coupons')
  .setDescription('[Owner] SellAuth — manage coupons')

  .addSubcommand(s => s.setName('list').setDescription('List coupons')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one coupon')
    .addStringOption(cidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a coupon')
    .addStringOption(o => o.setName('code').setDescription('Code').setRequired(true))
    .addNumberOption(o => o.setName('discount').setDescription('Discount value').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('percentage / fixed').setRequired(true)
      .addChoices({ name: 'percentage', value: 'percentage' }, { name: 'fixed', value: 'fixed' }))
    .addBooleanOption(o => o.setName('global').setDescription('Apply to all products').setRequired(true))
    .addStringOption(o => o.setName('items').setDescription('CSV product IDs (when global=false)'))
    .addIntegerOption(o => o.setName('max_uses').setDescription('Max usage count'))
    .addStringOption(o => o.setName('expiration_date').setDescription('ISO datetime'))
    .addStringOption(o => o.setName('allowed_emails').setDescription('CSV of allowed emails'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a coupon (JSON body)')
    .addStringOption(cidOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a coupon')
    .addStringOption(cidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete-used').setDescription('Delete all used coupons')
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/coupons`,
      title:    `Coupons — shop ${sid}`,
      row: (c, i) => ({
        name:  `\`${i+1}.\` ${c.code ?? '?'} — \`${c.id}\``,
        value: [
          `> Type: \`${c.type ?? '-'}\``,
          `> Discount: \`${c.discount ?? '-'}\``,
          `> Uses: \`${c.uses ?? 0}/${c.max_uses ?? '∞'}\``,
          c.expiration_date ? `> Expires: ${Row.rel(c.expiration_date)}` : '',
        ].filter(Boolean).join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'delete-used') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/coupons/used`), {
      title: 'Delete used coupons', render: (p) => renderOk(ctx, { title: 'Used coupons deleted', data: p }),
    });
  }

  const cid = interaction.options.getString('coupon_id');

  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/coupons/${cid}`), {
      title: 'Coupon', render: (p) => renderItem(ctx, p, { title: `Coupon \`${cid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/coupons/${cid}`), {
      title: 'Delete coupon', render: (p) => renderOk(ctx, { title: 'Coupon deleted', data: p }),
    });
  }
  if (sub === 'create') {
    const items = interaction.options.getString('items');
    const allowedEmails = interaction.options.getString('allowed_emails');
    const body = {
      code:            interaction.options.getString('code'),
      discount:        interaction.options.getNumber('discount'),
      type:            interaction.options.getString('type'),
      global:          interaction.options.getBoolean('global'),
      items:           items ? items.split(',').map(x => x.trim()).filter(Boolean) : undefined,
      max_uses:        interaction.options.getInteger('max_uses') ?? undefined,
      expiration_date: interaction.options.getString('expiration_date') ?? undefined,
      allowed_emails:  allowedEmails ? allowedEmails.split(',').map(x => x.trim()).filter(Boolean) : undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/coupons`, body), {
      title: 'Create coupon', render: (p) => renderOk(ctx, { title: 'Coupon created', data: p }),
    });
  }
  if (sub === 'update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    return runApi(ctx, () => sa.put(`/shops/${sid}/coupons/${cid}/update`, body), {
      title: 'Update coupon', render: (p) => renderOk(ctx, { title: 'Coupon updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
