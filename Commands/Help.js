// ./Commands/Help.js

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} from 'discord.js';
import { makeEmbed, Emoji }                    from '../Utils/Embeds.js';
import { ctxFromInteraction, ctxFromMessage }  from '../Utils/Commands.js';

export const category = 'Misc';
export const aliases  = ['h', 'commands'];

const CATEGORY_META = {
  'Activity Logs':   { emoji: Emoji.ICLog,      desc: 'Activity logs.' },
  'Analytics':       { emoji: Emoji.ICChart,    desc: 'Revenue / top stats.' },
  'Blacklist':       { emoji: Emoji.ICBan,      desc: 'Block emails / IPs / etc.' },
  'Blog Posts':      { emoji: Emoji.ICBlog,     desc: 'Blog post management.' },
  'Categories':      { emoji: Emoji.ICCategory, desc: 'Product categories.' },
  'Checkout':        { emoji: Emoji.ICCheckout, desc: 'Create checkout sessions.' },
  'Coupons':         { emoji: Emoji.ICCoupon,   desc: 'Discount coupons.' },
  'Crypto Wallet':   { emoji: Emoji.ICCrypto,   desc: 'Payouts / balances.' },
  'Custom Fields':   { emoji: Emoji.ICField,    desc: 'Product custom fields.' },
  'Customers':       { emoji: Emoji.ICCustomer, desc: 'Customers + balances.' },
  'Domains':         { emoji: Emoji.ICDomain,   desc: 'Custom domains.' },
  'Feedbacks':       { emoji: Emoji.ICFeedback, desc: 'Reviews & disputes.' },
  'Groups':          { emoji: Emoji.ICGroup,    desc: 'Product groups.' },
  'Images':          { emoji: Emoji.ICImage,    desc: 'Upload / delete images.' },
  'Invoices':        { emoji: Emoji.ICInvoice,  desc: 'Invoices / refunds.' },
  'Notifications':   { emoji: Emoji.ICBell,     desc: 'Notifications & settings.' },
  'Payment Methods': { emoji: Emoji.ICPayment,  desc: 'Payment gateways.' },
  'Products':        { emoji: Emoji.ICProduct,  desc: 'CRUD products + bulk.' },
  'Shops':           { emoji: Emoji.ICShop,     desc: 'CRUD shops + stats.' },
  'Tickets':         { emoji: Emoji.ICTicket,   desc: 'Support tickets.' },
  'Misc':            { emoji: Emoji.ICSparkle,  desc: 'Help / raw API.' },
};

function metaFor(cat) {
  return CATEGORY_META[cat] ?? { emoji: Emoji.ICDot, desc: '' };
}

function listInvocations(command) {
  const json = command.data.toJSON();
  const out  = [];
  const opts = json.options ?? [];
  const subs = opts.filter(o => o.type === 1);
  const grps = opts.filter(o => o.type === 2);

  if (!subs.length && !grps.length) {
    out.push({ path: json.name, description: json.description });
    return out;
  }
  for (const sub of subs) out.push({ path: `${json.name} ${sub.name}`, description: sub.description });
  for (const grp of grps) {
    for (const s of (grp.options ?? []).filter(o => o.type === 1)) {
      out.push({ path: `${json.name} ${grp.name} ${s.name}`, description: s.description });
    }
  }
  return out;
}

function mention(path, id) { return id ? `</${path}:${id}>` : `\`/${path}\``; }

function groupCommandsByCategory(client) {
  const map = new Map();
  for (const cmd of client.commands.values()) {
    const cat = cmd.category ?? 'Misc';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(cmd);
  }
  for (const list of map.values()) list.sort((a, b) => a.data.name.localeCompare(b.data.name));
  return map;
}

function buildOverview(client, user) {
  const grouped = groupCommandsByCategory(client);
  const fields  = [];
  for (const [cat, cmds] of grouped) {
    const meta = metaFor(cat);
    const total = cmds.reduce((s, c) => s + listInvocations(c).length, 0);
    fields.push({
      name:   `${meta.emoji} ${cat} \`[${total}]\``,
      value:  meta.desc || '—',
      inline: true,
    });
  }
  return makeEmbed({
    type:        'Debug',
    title:       `${Emoji.ICSparkle} Sellauth AIO — Overview`,
    description: '> Pick a category from the dropdown to see its commands.\n> Supports slash `/` and prefix `;`.',
    user,
    fields,
  });
}

function buildCategoryEmbed(client, cat, user) {
  const meta    = metaFor(cat);
  const grouped = groupCommandsByCategory(client);
  const cmds    = grouped.get(cat) ?? [];
  const ids     = client.commandIds ?? new Map();

  const fields = [];
  for (const cmd of cmds) {
    const id   = ids.get(cmd.data.name);
    for (const inv of listInvocations(cmd)) {
      const desc = (inv.description ?? '').replace(/^\[.*?\]\s*/, '').slice(0, 75);
      fields.push({
        name:   `${meta.emoji} ${mention(inv.path, id)}`,
        value:  `> ${desc || '—'}`,
        inline: true,
      });
    }
  }
  while (fields.length && fields.length % 3 !== 0) {
    fields.push({ name: '​', value: '​', inline: true });
  }
  return makeEmbed({
    type:        'Debug',
    title:       `${meta.emoji} ${cat}`,
    description: `> ${meta.desc || ''}\n> ${fields.filter(f => f.name !== '​').length} command(s).`,
    user,
    fields,
  });
}

function buildSelectRow(client, selected) {
  const grouped = groupCommandsByCategory(client);
  const opts = [
    { label: 'Overview', value: 'overview', emoji: '📖', default: !selected || selected === 'overview' },
    ...[...grouped.keys()].map(cat => ({
      label: cat,
      value: cat,
      emoji: undefined,
      description: metaFor(cat).desc.slice(0, 100),
      default: selected === cat,
    })),
  ];
  const menu = new StringSelectMenuBuilder()
    .setCustomId('help:select')
    .setPlaceholder('Pick a category')
    .addOptions(opts.slice(0, 25));
  return new ActionRowBuilder().addComponents(menu);
}

export function buildHelp(client, selected, user) {
  const cat = (!selected || selected === 'overview') ? null : selected;
  const components = [buildSelectRow(client, selected ?? 'overview')];
  const embed = cat ? buildCategoryEmbed(client, cat, user) : buildOverview(client, user);
  return { embeds: [embed], components, flags: MessageFlags.Ephemeral };
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('[Everyone] List all commands grouped by category');

export async function execute(interaction) {
  return interaction.reply(buildHelp(interaction.client, null, interaction.user));
}

export async function executePrefix(message, args) {
  const ctx = ctxFromMessage(message);
  const arg = (args[0] ?? '').trim();
  const cat = arg
    ? (Object.keys(CATEGORY_META).find(k => k.toLowerCase() === arg.toLowerCase()) ?? arg)
    : null;
  const { embeds, components } = buildHelp(message.client, cat, message.author);
  return ctx.reply({ embeds, components });
}

export default { data, execute, executePrefix, aliases, category };
