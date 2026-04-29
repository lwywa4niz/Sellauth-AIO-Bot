// ./Commands/Blogs.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, qs, resolveShopId, perPage }                from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Blog Posts';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);
const pidOpt  = (o) => o.setName('post_id').setDescription('Post ID').setRequired(true).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('blogs')
  .setDescription('[Owner] SellAuth — manage blog posts')

  .addSubcommand(s => s.setName('list').setDescription('List blog posts')
    .addStringOption(o => o.setName('title').setDescription('Filter by title'))
    .addIntegerOption(o => o.setName('page').setDescription('Page').setMinValue(1))
    .addIntegerOption(o => o.setName('per_page').setDescription('Per page').setMinValue(1).setMaxValue(50))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('get').setDescription('Get one post')
    .addStringOption(pidOpt).addStringOption(shopOpt))
  .addSubcommand(s => s.setName('create').setDescription('Create a post')
    .addStringOption(o => o.setName('title').setDescription('Title').setRequired(true))
    .addStringOption(o => o.setName('content').setDescription('Content (markdown / html)').setRequired(true))
    .addStringOption(o => o.setName('path').setDescription('Path / slug'))
    .addStringOption(o => o.setName('summary').setDescription('Short summary'))
    .addIntegerOption(o => o.setName('image_id').setDescription('Cover image ID'))
    .addStringOption(o => o.setName('meta_title').setDescription('SEO meta title'))
    .addStringOption(o => o.setName('meta_description').setDescription('SEO description'))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('update').setDescription('Update a post (JSON body)')
    .addStringOption(pidOpt)
    .addStringOption(o => o.setName('body').setDescription('JSON body').setRequired(true))
    .addStringOption(shopOpt))
  .addSubcommand(s => s.setName('delete').setDescription('Delete a post')
    .addStringOption(pidOpt).addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'list') {
    const params = qs(
      ['title',   interaction.options.getString('title')],
      ['page',    interaction.options.getInteger('page')],
      ['perPage', interaction.options.getInteger('per_page') ?? perPage()],
    );
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/blog-posts`,
      params,
      title:    `Blog posts — shop ${sid}`,
      row: (b, i) => ({
        name:  `\`${i+1}.\` ${b.title ?? '?'} — \`${b.id}\``,
        value: [
          `> Path: \`${b.path ?? '-'}\``,
          `> Created: ${Row.rel(b.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }

  if (sub === 'create') {
    const body = {
      title:            interaction.options.getString('title'),
      content:          interaction.options.getString('content'),
      path:             interaction.options.getString('path') ?? undefined,
      summary:          interaction.options.getString('summary') ?? undefined,
      image_id:         interaction.options.getInteger('image_id') ?? undefined,
      meta_title:       interaction.options.getString('meta_title') ?? undefined,
      meta_description: interaction.options.getString('meta_description') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/blog-posts`, body), {
      title: 'Create blog', render: (p) => renderOk(ctx, { title: 'Post created', data: p }),
    });
  }

  const pid = interaction.options.getString('post_id');
  if (sub === 'get') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/blog-posts/${pid}`), {
      title: 'Blog post', render: (p) => renderItem(ctx, p, { title: `Post \`${pid}\``, showRaw: true }),
    });
  }
  if (sub === 'delete') {
    return runApi(ctx, () => sa.delete(`/shops/${sid}/blog-posts/${pid}`), {
      title: 'Delete blog', render: (p) => renderOk(ctx, { title: 'Post deleted', data: p }),
    });
  }
  if (sub === 'update') {
    let body;
    try { body = JSON.parse(interaction.options.getString('body')); }
    catch { throw new Error('Invalid JSON body.'); }
    body.id = body.id ?? Number(pid);
    return runApi(ctx, () => sa.put(`/shops/${sid}/blog-posts/${pid}`, body), {
      title: 'Update blog', render: (p) => renderOk(ctx, { title: 'Post updated', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
