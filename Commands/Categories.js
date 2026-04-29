// ./Commands/Categories.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Categories';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const cidOpt  = (o) => o.setName('category_id').setDescription('Category ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('categories')
  .setDescription('[Owner] SellAuth — manage categories')

  .addSubcommand(s => s.setName('list').setDescription('List categories')
    .addStringOption(o => o.setName('name').setDescription('Filter by name'))
    .addIntegerOption(o => o.setName('parent_id').setDescription('Filter by parent_id'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one category')
    .addStringOption(cidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a category')
    .addStringOption(o => o.setName('name').setDescription('Name').setRequired(true))
    .addIntegerOption(o => o.setName('parent_id').setDescription('Parent ID'))
    .addStringOption(o => o.setName('path').setDescription('Path'))
    .addStringOption(o => o.setName('description').setDescription('Description'))
    .addStringOption(o => o.setName('color').setDescription('Color hex'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a category (JSON body)')
    .addStringOption(cidOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a category')
    .addStringOption(cidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('reorder').setDescription('Reorder categories')
    .addStringOption(o => o.setName('categories').setDescription('JSON array').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const params = qs(
      ['name',      interaction.options.getString('name')],
      ['parent_id', interaction.options.getInteger('parent_id')],
      ['page',      interaction.options.getInteger('page')],
      ['perPage',   interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/categories`,
      params,
      title:    `Categories — shop ${sid}`,
      row: (c, i) => ({
        name:  `\`${i+1}.\` ${c.name ?? '?'} — \`${c.id}\``,
        value: [
          `> Path: \`${c.path ?? '-'}\``,
          `> Parent: \`${c.parent_id ?? '-'}\``,
          `> Created: ${Row.rel(c.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'reorder') {
    let categories;
    try { categories = JSON.parse(interaction.options.getString('categories')); }
    catch { throw new Error('Invalid categories JSON.'); }
    return runApi(ctx, () => sa.post(`/shops/${sid}/categories/reorder`, { categories }), {
      title: 'Reorder', render: (p) => renderOk(ctx, { title: 'Reordered', data: p }),
    });
  }

  const cid = interaction.options.getString('category_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/categories/${cid}`), {
      title: 'Category', render: (p) => renderItem(ctx, p, { title: `Category \`${cid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/categories/${cid}`), {
      title: 'Delete category', render: (p) => renderOk(ctx, { title: 'Category deleted', data: p }),
    });
  }
  if (sub === 'create') {
    const body = {
      name:        interaction.options.getString('name'),
      parent_id:   interaction.options.getInteger('parent_id') ?? undefined,
      path:        interaction.options.getString('path') ?? undefined,
      description: interaction.options.getString('description') ?? undefined,
      color:       interaction.options.getString('color') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/categories`, body), {
      title: 'Create category', render: (p) => renderOk(ctx, { title: 'Category created', data: p }),
    });
  }
  if (sub === 'update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    body.id = body.id ?? Number(cid);
    return runApi(ctx, () => sa.put(`/shops/${sid}/categories/${cid}`, body), {
      title: 'Update category', render: (p) => renderOk(ctx, { title: 'Category updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
