// ./Commands/Activity.js

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { qs, resolveShopId, perPage }          from '../Utils/SellAuth.js';
import { runListApi, Row }                     from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Activity Logs';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('activity')
  .setDescription('[Owner] SellAuth — activity logs')

  .addSubcommand(s => s.setName('logs').setDescription('View activity logs')
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sid = resolveShopId(interaction.options.getString('shop'));

  const params = qs(
    ['page',    interaction.options.getInteger('page')],
    ['perPage', interaction.options.getInteger('per_page') ?? perPage()],
  );

  return runListApi(ctx, {
    endpoint: `/shops/${sid}/activity-logs`,
    params,
    title:    `Activity logs — shop ${sid}`,
    row: (a, i) => ({
      name:  `\`${i+1}.\` ${a.action ?? a.type ?? '?'} — \`${a.id}\``,
      value: [
        `> Subject: \`${a.subject_type ?? '-'}\``,
        `> User: \`${a.user?.email ?? a.user_id ?? '-'}\``,
        `> ${Row.rel(a.created_at)}`,
      ].join('\n'),
      inline: true,
    }),
  });
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
