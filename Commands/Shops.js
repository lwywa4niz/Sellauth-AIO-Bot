// ./Commands/Shops.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa }                                            from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Shops';

const shopIdOpt = (o) => o.setName('shop_id').setDescription('Shop ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('shops')
  .setDescription('[Owner] SellAuth — manage shops')
  .addSubcommand(s => s.setName('list').setDescription('List all of your shops'))
  .addSubcommand(s => s.setName('get').setDescription('Show details of one shop')
    .addStringOption(shopIdOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a new shop')
    .addStringOption(o => o.setName('name').setDescription('Shop name').setRequired(true))
    .addStringOption(o => o.setName('subdomain').setDescription('Subdomain').setRequired(true))
    .addStringOption(o => o.setName('logo').setDescription('Logo URL or image_id').setRequired(false)))
  .addSubcommand(s => s.setName('update').setDescription('Update a shop (send a JSON body)')
    .addStringOption(shopIdOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body to PUT').setRequired(true)))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a shop')
    .addStringOption(shopIdOpt)
    .addStringOption(o => o.setName('password').setDescription('Confirmation password').setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('Confirmation shop name').setRequired(true)))
  .addSubcommand(s => s.setName('stats').setDescription('Shop statistics')
    .addStringOption(shopIdOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: '/shops',
      title:   'Shops',
      row: (s, i) => ({
        name:  `\`${i + 1}.\` ${s.name ?? '?'} — \`${s.id}\``,
        value: [
          `> Subdomain: \`${s.subdomain ?? '-'}\``,
          `> Created: ${Row.rel(s.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'get') {
    const id = interaction.options.getString('shop_id');
    return runApi(ctx, () => sa.get(`/shops/${id}`), {
      title: 'Shop',
      render: (payload) => renderItem(ctx, payload, {
        title: `Shop \`${id}\``,
        keys: [
          ['id', 'ID'],
          ['name', 'Name'],
          ['subdomain', 'Subdomain'],
          ['domain', 'Domain'],
          ['currency', 'Currency'],
          ['created_at', 'Created', (v) => Row.rel(v)],
          ['updated_at', 'Updated', (v) => Row.rel(v)],
        ],
        showRaw: true,
      }),
    });
  }

  if (sub === 'create') {
    const body = {
      name:      interaction.options.getString('name'),
      subdomain: interaction.options.getString('subdomain'),
    };
    const logo = interaction.options.getString('logo');
    if (logo) body.logo = logo;
    return runApi(ctx, () => sa.post('/shops/create', body), {
      title: 'Create shop',
      render: (payload) => renderOk(ctx, { title: 'Shop created', data: payload }),
    });
  }

  if (sub === 'update') {
    const id   = interaction.options.getString('shop_id');
    const raw  = interaction.options.getString('body');
    let body;
    try { body = JSON.parse(raw); }
    catch { throw new Error(`Invalid JSON body: ${raw}`); }
    return runApi(ctx, () => sa.put(`/shops/${id}/update`, body), {
      title: 'Update shop',
      render: (payload) => renderOk(ctx, { title: 'Shop updated', data: payload }),
    });
  }

  if (sub === 'delete') {
    const id   = interaction.options.getString('shop_id');
    const pwd  = interaction.options.getString('password');
    const name = interaction.options.getString('name');
    return runApi(ctx, () => sa.delete(`/shops/${id}`, { data: { password: pwd, name } }), {
      title: 'Delete shop',
      render: (payload) => renderOk(ctx, { title: 'Shop deleted', data: payload }),
    });
  }

  if (sub === 'stats') {
    const id = interaction.options.getString('shop_id');
    return runApi(ctx, () => sa.get(`/shops/${id}/stats`), {
      title: 'Shop stats',
      render: (payload) => renderItem(ctx, payload, { title: `Stats — shop \`${id}\``, showRaw: true }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
