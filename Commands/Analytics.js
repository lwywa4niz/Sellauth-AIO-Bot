// ./Commands/Analytics.js

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa, resolveShopId }                   from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem }      from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Analytics';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('analytics')
  .setDescription('[Owner] SellAuth — analytics & reports')

  .addSubcommand(s => s.setName('overview').setDescription('Revenue / orders / customers').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('graph').setDescription('Graph data').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('top-products').setDescription('Top products by revenue').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('top-customers').setDescription('Top customers by revenue').addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'overview') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/analytics`), {
      title: 'Analytics', render: (p) => renderItem(ctx, p, { title: `Analytics — shop ${sid}`, showRaw: true }),
    });
  }
  if (sub === 'graph') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/analytics/graph`), {
      title: 'Analytics graph', render: (p) => renderItem(ctx, p, { title: `Graph — shop ${sid}`, showRaw: true }),
    });
  }
  if (sub === 'top-products') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/analytics/top-products`,
      title:    `Top products — shop ${sid}`,
      row: (r, i) => ({
        name:  `\`${i+1}.\` ${r.name ?? r.product_name ?? '?'}`,
        value: `> Revenue: \`${r.revenue ?? r.total ?? '-'}\`\n> Orders: \`${r.orders ?? r.count ?? '-'}\``,
        inline: true,
      }),
    });
  }
  if (sub === 'top-customers') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/analytics/top-customers`,
      title:    `Top customers — shop ${sid}`,
      row: (r, i) => ({
        name:  `\`${i+1}.\` ${r.email ?? r.name ?? '?'}`,
        value: `> Spent: \`${r.spent ?? r.total ?? '-'}\`\n> Orders: \`${r.orders ?? r.count ?? '-'}\``,
        inline: true,
      }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
