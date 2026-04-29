// ./Commands/Domains.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, resolveShopId }                             from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';
export const category = 'Domains';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const didOpt  = (o) => o.setName('domain_id').setDescription('Domain ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('domains')
  .setDescription('[Owner] SellAuth — manage custom domains')

  .addSubcommand(s => s.setName('list').setDescription('List domains')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one domain')
    .addStringOption(didOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('add').setDescription('Add a domain (send a JSON body)')
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a domain')
    .addStringOption(didOpt).addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/domains`,
      title:    `Domains — shop ${sid}`,
      row: (d, i) => ({
        name:  `\`${i+1}.\` ${d.domain ?? '?'} — \`${d.id}\``,
        value: [
          `> Verified: \`${d.verified ? 'yes' : 'no'}\``,
          `> Created: ${Row.rel(d.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'add') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    return runApi(ctx, () => sa.post(`/shops/${sid}/domains`, body), {
      title: 'Add domain', render: (p) => renderOk(ctx, { title: 'Domain added', data: p }),
    });
  }

  const did = interaction.options.getString('domain_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/domains/${did}`), {
      title: 'Domain', render: (p) => renderItem(ctx, p, { title: `Domain \`${did}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/domains/${did}`), {
      title: 'Delete domain', render: (p) => renderOk(ctx, { title: 'Domain deleted', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
