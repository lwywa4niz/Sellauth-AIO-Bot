// ./Commands/Products.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage, csvNum }        from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Products';

const shopOpt   = (o) => o.setName('shop').setDescription('Shop ID (omit to use default).').setRequired(false).setAutocomplete(true);
const prodIdOpt = (o) => o.setName('product_id').setDescription('Product ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('products')
  .setDescription('[Owner] SellAuth — manage products')

  .addSubcommandGroup(g => g.setName('manage').setDescription('Product CRUD')
    .addSubcommand(s => s.setName('list').setDescription('List products')
      .addStringOption(o => o.setName('name').setDescription('Filter by name'))
      .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
      .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
      .addStringOption(o => o.setName('type').setDescription('Product type'))
      .addStringOption(o => o.setName('order_column').setDescription('Sort column'))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('get').setDescription('Get one product')
      .addStringOption(prodIdOpt)
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('create').setDescription('Create a new product (send JSON body)')
      .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('update').setDescription('Update a product (JSON body)')
      .addStringOption(prodIdOpt)
      .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a product')
      .addStringOption(prodIdOpt)
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('clone').setDescription('Clone a product')
      .addStringOption(prodIdOpt)
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('sort').setDescription('Sort products / groups')
      .addStringOption(o => o.setName('sorted_ids').setDescription('JSON array').setRequired(true))
      .addStringOption(shopOpt)))

  .addSubcommandGroup(g => g.setName('stock').setDescription('Stock & deliverables')
    .addSubcommand(s => s.setName('update').setDescription('Update stock for a variant')
      .addStringOption(prodIdOpt)
      .addStringOption(o => o.setName('variant_id').setDescription('Variant ID').setRequired(true))
      .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('deliverables-get').setDescription('Get deliverables')
      .addStringOption(prodIdOpt)
      .addStringOption(o => o.setName('variant_id').setDescription('Variant ID').setRequired(true))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('deliverables-append').setDescription('Append deliverables')
      .addStringOption(prodIdOpt)
      .addStringOption(o => o.setName('variant_id').setDescription('Variant ID').setRequired(true))
      .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
      .addStringOption(shopOpt))
    .addSubcommand(s => s.setName('deliverables-overwrite').setDescription('Overwrite deliverables')
      .addStringOption(prodIdOpt)
      .addStringOption(o => o.setName('variant_id').setDescription('Variant ID').setRequired(true))
      .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
      .addStringOption(shopOpt)))

  .addSubcommand(s => s.setName('bulk-update').setDescription('Bulk update — pick a mode')
    .addStringOption(o => o.setName('mode').setDescription('Bulk update type').setRequired(true)
      .addChoices(
        { name: 'disabled-payment-methods', value: 'disabled-payment-methods' },
        { name: 'custom-fields',           value: 'custom-fields' },
        { name: 'addons',                  value: 'addons' },
        { name: 'upsells',                 value: 'upsells' },
        { name: 'discord-integration',     value: 'discord-integration' },
        { name: 'description',             value: 'description' },
        { name: 'instructions',            value: 'instructions' },
        { name: 'out-of-stock-message',    value: 'out-of-stock-message' },
        { name: 'security',                value: 'security' },
        { name: 'badges',                  value: 'badges' },
        { name: 'status',                  value: 'status' },
        { name: 'visibility',              value: 'visibility' },
        { name: 'live-stats',              value: 'live-stats' },
        { name: 'feedback-coupon',         value: 'feedback-coupon' },
        { name: 'volume-discounts',        value: 'volume-discounts' },
        { name: 'redirect-url',            value: 'redirect-url' },
        { name: 'deliverables-type',       value: 'deliverables-type' },
        { name: 'deliverables-label',      value: 'deliverables-label' },
      ))
    .addStringOption(o => o.setName('product_ids').setDescription('Comma-separated product IDs').setRequired(true))
    .addStringOption(o => o.setName('body').setDescription('JSON body with extra fields').setRequired(true))
    .addStringOption(shopOpt));

function shop(interaction) { return resolveShopId(interaction.options.getString('shop')); }
function parseJSON(raw, label = 'body') {
  try { return JSON.parse(raw); }
  catch { throw new Error(`Invalid ${label} JSON.`); }
}

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const grp = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  const sid = shop(interaction);

  if (grp === 'manage') {
    if (sub === 'list') {
      const params = qs(
        ['name',          interaction.options.getString('name')],
        ['page',          interaction.options.getInteger('page')],
        ['perPage',       interaction.options.getInteger('per_page') ?? perPage()],
        ['type',          interaction.options.getString('type')],
        ['orderColumn',   interaction.options.getString('order_column')],
      );
      return runListApi(ctx, {
        endpoint: `/shops/${sid}/products`,
        params,
        title:    `Products — shop ${sid}`,
        row: (p, i) => ({
          name:  `\`${i + 1}.\` ${p.name ?? '?'} — \`${p.id}\``,
          value: [
            `> Type: \`${p.type ?? '-'}\``,
            `> Path: \`${p.path ?? '-'}\``,
            `> Stock: \`${p.stock_count ?? '?'}\``,
            `> Created: ${Row.rel(p.created_at)}`,
          ].join('\n'),
          inline: true,
        }),
      });
    }
    if (sub === 'get') {
      const pid = interaction.options.getString('product_id');
      return runApi(ctx, () => sa.get(`/shops/${sid}/products/${pid}`), {
        title: 'Product', render: (p) => renderItem(ctx, p, { title: `Product \`${pid}\``, showRaw: true }),
      });
    }
    if (sub === 'create') {
      const body = parseJSON(interaction.options.getString('body'));
      return runApi(ctx, () => sa.post(`/shops/${sid}/products`, body), {
        title: 'Create product', render: (p) => renderOk(ctx, { title: 'Product created', data: p }),
      });
    }
    if (sub === 'update') {
      const pid  = interaction.options.getString('product_id');
      const body = parseJSON(interaction.options.getString('body'));
      return runApi(ctx, () => sa.put(`/shops/${sid}/products/${pid}/update`, body), {
        title: 'Update product', render: (p) => renderOk(ctx, { title: 'Product updated', data: p }),
      });
    }
    if (sub === 'delete') {
      const pid = interaction.options.getString('product_id');
      return runApi(ctx, () => sa.delete(`/shops/${sid}/products/${pid}`), {
        title: 'Delete product', render: (p) => renderOk(ctx, { title: 'Product deleted', data: p }),
      });
    }
    if (sub === 'clone') {
      const pid = interaction.options.getString('product_id');
      return runApi(ctx, () => sa.post(`/shops/${sid}/products/${pid}/clone`, {}), {
        title: 'Clone product', render: (p) => renderOk(ctx, { title: 'Product cloned', data: p }),
      });
    }
    if (sub === 'sort') {
      const sortedIds = parseJSON(interaction.options.getString('sorted_ids'), 'sorted_ids');
      return runApi(ctx, () => sa.put(`/shops/${sid}/products/sort`, { sortedIds }), {
        title: 'Sort products', render: (p) => renderOk(ctx, { title: 'Sorted', data: p }),
      });
    }
  }

  if (grp === 'stock') {
    const pid = interaction.options.getString('product_id');
    const vid = interaction.options.getString('variant_id');
    if (sub === 'update') {
      const body = parseJSON(interaction.options.getString('body'));
      return runApi(ctx, () => sa.put(`/shops/${sid}/products/${pid}/stock/${vid}`, body), {
        title: 'Update stock', render: (p) => renderOk(ctx, { title: 'Stock updated', data: p }),
      });
    }
    if (sub === 'deliverables-get') {
      return runApi(ctx, () => sa.get(`/shops/${sid}/products/${pid}/deliverables/${vid}`), {
        title: 'Deliverables', render: (p) => renderItem(ctx, p, { title: 'Deliverables', showRaw: true }),
      });
    }
    if (sub === 'deliverables-append') {
      const body = parseJSON(interaction.options.getString('body'));
      return runApi(ctx, () => sa.put(`/shops/${sid}/products/${pid}/deliverables/append/${vid}`, body), {
        title: 'Append deliverables', render: (p) => renderOk(ctx, { title: 'Appended', data: p }),
      });
    }
    if (sub === 'deliverables-overwrite') {
      const body = parseJSON(interaction.options.getString('body'));
      return runApi(ctx, () => sa.put(`/shops/${sid}/products/${pid}/deliverables/overwrite/${vid}`, body), {
        title: 'Overwrite deliverables', render: (p) => renderOk(ctx, { title: 'Overwritten', data: p }),
      });
    }
  }

  if (sub === 'bulk-update') {
    const mode = interaction.options.getString('mode');
    const ids  = csvNum(interaction.options.getString('product_ids'));
    const body = parseJSON(interaction.options.getString('body'));
    return runApi(ctx, () => sa.put(`/shops/${sid}/products/bulk-update/${mode}`, { product_ids: ids, ...body }), {
      title: `Bulk: ${mode}`, render: (p) => renderOk(ctx, { title: `Bulk ${mode} done`, data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
