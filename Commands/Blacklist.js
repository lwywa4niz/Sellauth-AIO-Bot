// ./Commands/Blacklist.js

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa, resolveShopId }                   from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Blacklist';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const bidOpt  = (o) => o.setName('blacklist_id').setDescription('Blacklist ID').setRequired(true).setAutocomplete(true);

const TYPE_CHOICES = [
  { name: 'email',        value: 'email' },
  { name: 'ip',           value: 'ip' },
  { name: 'user_agent',   value: 'user_agent' },
  { name: 'vpn',          value: 'vpn' },
  { name: 'asn',          value: 'asn' },
  { name: 'country_code', value: 'country_code' },
  { name: 'discord_id',   value: 'discord_id' },
];

const MATCH_CHOICES = [
  { name: 'exact', value: 'exact' },
  { name: 'regex', value: 'regex' },
];

export const data = new SlashCommandBuilder()
  .setName('blacklist')
  .setDescription('[Owner] SellAuth — manage blacklist')

  .addSubcommand(s => s.setName('list').setDescription('List blacklist entries')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one entry')
    .addStringOption(bidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('add').setDescription('Add a new entry')
    .addStringOption(o => o.setName('value').setDescription('Value to block').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Type').setRequired(true).addChoices(...TYPE_CHOICES))
    .addStringOption(o => o.setName('match_type').setDescription('Match type').setRequired(true).addChoices(...MATCH_CHOICES))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update an entry')
    .addStringOption(bidOpt)
    .addStringOption(o => o.setName('value').setDescription('Value').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Type').setRequired(true).addChoices(...TYPE_CHOICES))
    .addStringOption(o => o.setName('match_type').setDescription('Match type').setRequired(true).addChoices(...MATCH_CHOICES))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete an entry')
    .addStringOption(bidOpt).addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/blacklist`,
      title:    `Blacklist — shop ${sid}`,
      row: (b, i) => ({
        name:  `\`${i+1}.\` \`${b.type ?? '?'}\` — \`${b.id}\``,
        value: [
          `> Value: \`${b.value ?? '-'}\``,
          `> Match: \`${b.match_type ?? '-'}\``,
          `> Created: ${Row.rel(b.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'add') {
    const body = {
      value:      interaction.options.getString('value'),
      type:       interaction.options.getString('type'),
      match_type: interaction.options.getString('match_type'),
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/blacklist`, body), {
      title: 'Add blacklist', render: (p) => renderOk(ctx, { title: 'Added to blacklist', data: p }),
    });
  }

  const bid = interaction.options.getString('blacklist_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/blacklist/${bid}`), {
      title: 'Blacklist entry', render: (p) => renderItem(ctx, p, { title: `Entry \`${bid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/blacklist/${bid}`), {
      title: 'Delete blacklist', render: (p) => renderOk(ctx, { title: 'Entry deleted', data: p }),
    });
  }
  if (sub === 'update') {
    const body = {
      id:         Number(bid),
      value:      interaction.options.getString('value'),
      type:       interaction.options.getString('type'),
      match_type: interaction.options.getString('match_type'),
    };
    return runApi(ctx, () => sa.put(`/shops/${sid}/blacklist/${bid}/update`, body), {
      title: 'Update blacklist', render: (p) => renderOk(ctx, { title: 'Entry updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
