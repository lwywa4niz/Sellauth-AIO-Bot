// ./Commands/Raw.js
//
// Generic raw passthrough — lets you hit any SellAuth endpoint that isn't
// covered by a dedicated command. Owner-only — useful for debugging.

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa }                                  from '../Utils/SellAuth.js';
import { runApi, renderOk }                    from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';

export const category = 'Misc';

export const data = new SlashCommandBuilder()
  .setName('sa')
  .setDescription('[Owner] Raw SellAuth API call')
  .addStringOption(o => o.setName('method').setDescription('HTTP method').setRequired(true)
    .addChoices(
      { name: 'GET',    value: 'GET' },
      { name: 'POST',   value: 'POST' },
      { name: 'PUT',    value: 'PUT' },
      { name: 'DELETE', value: 'DELETE' },
    ))
  .addStringOption(o => o.setName('path').setDescription('Path relative to /v1, e.g. /shops/123').setRequired(true))
  .addStringOption(o => o.setName('body').setDescription('JSON body (POST / PUT)'))
  .addStringOption(o => o.setName('params').setDescription('JSON query params'))
  .addBooleanOption(o => o.setName('ephemeral').setDescription('Hide reply').setRequired(false));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;

  const method = interaction.options.getString('method');
  const path   = interaction.options.getString('path').trim();

  let body, params;
  const rawBody = interaction.options.getString('body');
  if (rawBody) { try { body   = JSON.parse(rawBody); }   catch { throw new Error('Invalid body JSON.'); } }
  const rawPar  = interaction.options.getString('params');
  if (rawPar)  { try { params = JSON.parse(rawPar); }    catch { throw new Error('Invalid params JSON.'); } }

  return runApi(ctx, () => sa.request(method, path.startsWith('/') ? path : `/${path}`, { data: body, params }), {
    title: `${method} ${path}`,
    render: (p) => renderOk(ctx, { title: `${method} ${path}`, data: p }),
  });
}

export default { data, execute, category };
