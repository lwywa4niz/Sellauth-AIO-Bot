// ./Commands/Images.js

import { SlashCommandBuilder }                 from 'discord.js';
import axios                                   from 'axios';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa, resolveShopId }                   from '../Utils/SellAuth.js';
import { runApi, runListApi, renderOk, Row }   from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Images';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const idOpt   = (o) => o.setName('image_id').setDescription('Image ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('images')
  .setDescription('[Owner] SellAuth — manage images')

  .addSubcommand(s => s.setName('list').setDescription('List images').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('upload').setDescription('Upload image from a Discord attachment')
    .addAttachmentOption(o => o.setName('file').setDescription('Image file').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('upload-url').setDescription('Upload image from a URL')
    .addStringOption(o => o.setName('url').setDescription('Image URL').setRequired(true))
    .addStringOption(o => o.setName('filename').setDescription('File name').setRequired(false))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete one image')
    .addStringOption(idOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('bulk-delete').setDescription('Bulk delete images')
    .addStringOption(o => o.setName('image_ids').setDescription('CSV image IDs').setRequired(true))
    .addStringOption(shopOpt));

async function uploadFromUrl(url, filename) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  return { buffer: Buffer.from(res.data), filename: filename ?? url.split('/').pop() ?? 'upload.png' };
}

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/images`,
      title:    `Images — shop ${sid}`,
      row: (im, i) => ({
        name:  `\`${i+1}.\` ${im.filename ?? im.name ?? '?'} — \`${im.id}\``,
        value: [
          im.url ? `> [link](${im.url})` : '',
          `> Created: ${Row.rel(im.created_at)}`,
        ].filter(Boolean).join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'upload') {
    const att = interaction.options.getAttachment('file');
    return runApi(ctx, async () => {
      const { buffer, filename } = await uploadFromUrl(att.url, att.name);
      return sa.upload(`/shops/${sid}/images`, { fileBuffer: buffer, fileName: filename });
    }, {
      title: 'Upload image', render: (p) => renderOk(ctx, { title: 'Image uploaded', data: p }),
    });
  }
  if (sub === 'upload-url') {
    const url      = interaction.options.getString('url');
    const filename = interaction.options.getString('filename');
    return runApi(ctx, async () => {
      const { buffer, filename: fn } = await uploadFromUrl(url, filename);
      return sa.upload(`/shops/${sid}/images`, { fileBuffer: buffer, fileName: fn });
    }, {
      title: 'Upload image (URL)', render: (p) => renderOk(ctx, { title: 'Image uploaded', data: p }),
    });
  }

  if (sub === 'delete') {
    const id = interaction.options.getString('image_id');
    return runApi(ctx, () => sa.delete(`/shops/${sid}/images/${id}`), {
      title: 'Delete image', render: (p) => renderOk(ctx, { title: 'Image deleted', data: p }),
    });
  }
  if (sub === 'bulk-delete') {
    const ids = interaction.options.getString('image_ids').split(',').map(s => Number(s.trim())).filter(Boolean);
    return runApi(ctx, () => sa.post(`/shops/${sid}/images/bulk-delete`, { image_ids: ids }), {
      title: 'Bulk delete', render: (p) => renderOk(ctx, { title: 'Bulk delete done', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
