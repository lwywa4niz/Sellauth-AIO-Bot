// ./Commands/Notifications.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, resolveShopId }                             from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Notifications';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('notifications')
  .setDescription('[Owner] SellAuth — notifications')

  .addSubcommand(s => s.setName('latest').setDescription('Latest notifications')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('page').setDescription('Paginated notifications')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('mark-read').setDescription('Mark all as read')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('settings-get').setDescription('View notification settings')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('settings-update').setDescription('Update notification settings (JSON body)')
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  const notifRow = (n, i) => ({
    name:  `\`${i+1}.\` ${n.title ?? n.type ?? '?'}`,
    value: [
      `> ${(n.message ?? n.body ?? '-').slice(0, 200)}`,
      `> ${Row.rel(n.created_at)}`,
    ].join('\n'),
    inline: true,
  });

  if (sub === 'latest') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/notifications/latest`,
      title:    `Latest notifications — shop ${sid}`,
      row:      notifRow,
    });
  }
  if (sub === 'page') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/notifications/page`,
      title:    `Notifications — shop ${sid}`,
      row:      notifRow,
    });
  }
  if (sub === 'mark-read') {
    return runApi(ctx, () => sa.post(`/shops/${sid}/notifications/mark-as-read`, {}), {
      title: 'Mark read', render: (p) => renderOk(ctx, { title: 'All marked as read', data: p }),
    });
  }
  if (sub === 'settings-get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/notifications/settings`), {
      title: 'Settings', render: (p) => renderItem(ctx, p, { title: 'Notification settings', showRaw: true }),
    });
  }
  if (sub === 'settings-update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    return runApi(ctx, () => sa.post(`/shops/${sid}/notifications/settings`, body), {
      title: 'Update settings', render: (p) => renderOk(ctx, { title: 'Settings updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
