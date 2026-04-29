// ./Commands/Groups.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, resolveShopId }                             from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Groups';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const gidOpt  = (o) => o.setName('group_id').setDescription('Group ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('groups')
  .setDescription('[Owner] SellAuth — product groups')

  .addSubcommand(s => s.setName('list').setDescription('List groups').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one group')
    .addStringOption(gidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a group')
    .addStringOption(o => o.setName('name').setDescription('Name').setRequired(true))
    .addStringOption(o => o.setName('visibility').setDescription('Visibility'))
    .addStringOption(o => o.setName('products').setDescription('CSV product IDs'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a group')
    .addStringOption(gidOpt)
    .addStringOption(o => o.setName('name').setDescription('Name').setRequired(true))
    .addStringOption(o => o.setName('visibility').setDescription('Visibility'))
    .addStringOption(o => o.setName('products').setDescription('CSV product IDs'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a group')
    .addStringOption(gidOpt).addStringOption(shopOpt));

function csvNum(s) {
  if (!s) return undefined;
  const arr = s.split(',').map(x => Number(x.trim())).filter(n => Number.isFinite(n));
  return arr.length ? arr : undefined;
}

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/groups`,
      title:    `Groups — shop ${sid}`,
      row: (g, i) => ({
        name:  `\`${i+1}.\` ${g.name ?? '?'} — \`${g.id}\``,
        value: `> Visibility: \`${g.visibility ?? '-'}\`\n> Products: \`${(g.products ?? []).length}\``,
        inline: true,
      }),
    });
  }

  if (sub === 'create') {
    const body = {
      name:       interaction.options.getString('name'),
      visibility: interaction.options.getString('visibility') ?? undefined,
      products:   csvNum(interaction.options.getString('products')),
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/groups`, body), {
      title: 'Create group', render: (p) => renderOk(ctx, { title: 'Group created', data: p }),
    });
  }

  const gid = interaction.options.getString('group_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/groups/${gid}`), {
      title: 'Group', render: (p) => renderItem(ctx, p, { title: `Group \`${gid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/groups/${gid}`), {
      title: 'Delete group', render: (p) => renderOk(ctx, { title: 'Group deleted', data: p }),
    });
  }
  if (sub === 'update') {
    const body = {
      name:       interaction.options.getString('name'),
      visibility: interaction.options.getString('visibility') ?? undefined,
      products:   csvNum(interaction.options.getString('products')),
    };
    return runApi(ctx, () => sa.put(`/shops/${sid}/groups/${gid}/update`, body), {
      title: 'Update group', render: (p) => renderOk(ctx, { title: 'Group updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
