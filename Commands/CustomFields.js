// ./Commands/CustomFields.js

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa, resolveShopId }                   from '../Utils/SellAuth.js';
import { runApi, runListApi, renderOk }        from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Custom Fields';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const fidOpt  = (o) => o.setName('field_id').setDescription('Field ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('customfields')
  .setDescription('[Owner] SellAuth — manage custom fields')

  .addSubcommand(s => s.setName('list').setDescription('List custom fields')
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a custom field')
    .addStringOption(o => o.setName('name').setDescription('Name').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Type').setRequired(true)
      .addChoices(
        { name: 'text', value: 'text' },
        { name: 'textarea', value: 'textarea' },
        { name: 'number', value: 'number' },
        { name: 'select', value: 'select' },
        { name: 'checkbox', value: 'checkbox' },
        { name: 'email', value: 'email' },
      ))
    .addStringOption(o => o.setName('placeholder').setDescription('Placeholder'))
    .addStringOption(o => o.setName('hint').setDescription('Hint'))
    .addStringOption(o => o.setName('options').setDescription('CSV for select'))
    .addStringOption(o => o.setName('default').setDescription('Default value'))
    .addStringOption(o => o.setName('regex').setDescription('Regex validation'))
    .addBooleanOption(o => o.setName('is_required').setDescription('Required'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a custom field (JSON body)')
    .addStringOption(fidOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a custom field')
    .addStringOption(fidOpt).addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/custom-fields`,
      title:    `Custom fields — shop ${sid}`,
      row: (f, i) => ({
        name:  `\`${i+1}.\` ${f.name ?? '?'} — \`${f.id}\``,
        value: [
          `> Type: \`${f.type ?? '-'}\``,
          `> Required: \`${f.is_required ? 'yes' : 'no'}\``,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'create') {
    const optsRaw = interaction.options.getString('options');
    const body = {
      name:        interaction.options.getString('name'),
      type:        interaction.options.getString('type'),
      placeholder: interaction.options.getString('placeholder') ?? undefined,
      hint:        interaction.options.getString('hint')        ?? undefined,
      options:     optsRaw ? optsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      default:     interaction.options.getString('default')     ?? undefined,
      regex:       interaction.options.getString('regex')       ?? undefined,
      is_required: interaction.options.getBoolean('is_required') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/custom-fields`, body), {
      title: 'Create field', render: (p) => renderOk(ctx, { title: 'Custom field created', data: p }),
    });
  }

  const fid = interaction.options.getString('field_id');
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/custom-fields/${fid}`), {
      title: 'Delete field', render: (p) => renderOk(ctx, { title: 'Custom field deleted', data: p }),
    });
  }
  if (sub === 'update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    return runApi(ctx, () => sa.put(`/shops/${sid}/custom-fields/${fid}`, body), {
      title: 'Update field', render: (p) => renderOk(ctx, { title: 'Custom field updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
