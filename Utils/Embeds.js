// ./Utils/Embeds.js

import { EmbedBuilder } from 'discord.js';
import { config }       from '../bot.js';

export const Emoji = {
  ICSuccess:  '✅',
  ICError:    '❌',
  ICWarn:     '⚠️',
  ICDebug:    '🛠️',
  ICInfo:     'ℹ️',
  ICDot:      '•',
  ICShop:     '🏪',
  ICProduct:  '📦',
  ICCustomer: '👤',
  ICInvoice:  '🧾',
  ICCoupon:   '🎟️',
  ICCategory: '🗂',
  ICBlog:     '📝',
  ICCheckout: '🛒',
  ICCrypto:   '🪙',
  ICField:    '🧩',
  ICDomain:   '🌐',
  ICFeedback: '💬',
  ICGroup:    '🧱',
  ICImage:    '🖼',
  ICBell:     '🔔',
  ICPayment:  '💳',
  ICTicket:   '🎫',
  ICChart:    '📊',
  ICLog:      '📜',
  ICBan:      '🚫',
  ICTrash:    '🗑',
  ICRefresh:  '🔄',
  ICSparkle:  '✨',
};

export function embedColor(type = 'Success') {
  return config?.Discord?.Embeds?.Colour?.[type] ?? '#00ff77';
}

export function applyFooter(embed, user = null) {
  const footerCfg    = config?.Discord?.Embeds?.Footer ?? {};
  const useTimestamp = footerCfg.Timestamp ?? true;

  const footerText = user
    ? `Requested by ${user.tag ?? user.username}`
    : (footerCfg.Text ?? 'Sellauth AIO');
  const footerIcon = footerCfg.Icon ?? null;

  embed.setFooter({
    text:    footerText,
    iconURL: user ? (user.displayAvatarURL({ dynamic: true }) ?? footerIcon) : footerIcon,
  });

  if (useTimestamp) embed.setTimestamp();
  return embed;
}

export function makeEmbed({
  type = 'Success', description, title, user = null,
  image = null, thumbnail = null, url = null, fields = null,
} = {}) {
  const embed = new EmbedBuilder().setColor(embedColor(type));
  if (title)       embed.setTitle(title);
  if (url)         embed.setURL(url);
  if (description) embed.setDescription(description);
  if (Array.isArray(fields)) {
    const clean = fields.filter(Boolean);
    if (clean.length) embed.addFields(clean);
  }
  if (image)       embed.setImage(image);
  if (thumbnail)   embed.setThumbnail(thumbnail);
  return applyFooter(embed, user);
}

// ── Helpers shared by every command ─────────────────────────────────────────

export function fld(name, value, inline = true) {
  return value == null || value === '' ? null : { name, value: String(value), inline };
}

export function code(v) { return v == null || v === '' ? '`-`' : `\`${v}\``; }

/**
 * Truncate any value to fit Discord's 1024-char field limit.
 */
export function trunc(s, max = 1000) {
  const str = String(s ?? '');
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

/**
 * Pretty-print a JSON object inside a code block, truncated to fit a field.
 */
export function jsonBlock(obj, max = 1000) {
  let body;
  try { body = JSON.stringify(obj, null, 2); }
  catch { body = String(obj); }
  return '```json\n' + trunc(body, max - 10) + '\n```';
}

/**
 * Render a unix-ish timestamp value (ISO string OR seconds OR ms) as a
 * Discord <t:..:R> relative time. Returns "-" if the value is empty.
 */
export function relTime(value) {
  if (!value) return '`-`';
  let ms;
  if (typeof value === 'number') {
    ms = value < 1e12 ? value * 1000 : value;
  } else {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '`-`';
    ms = d.getTime();
  }
  return `<t:${Math.floor(ms / 1000)}:R>`;
}

/**
 * Build a generic "success" embed from an API response. Keeps every command
 * short — they just hand the response over.
 */
export function apiOkEmbed({ title, user, fields = [], description = null, raw = null, thumbnail = null }) {
  const allFields = [...fields];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const keep = Object.entries(raw).filter(([k]) => !['html', 'description', 'content'].includes(k));
    if (allFields.length === 0 && keep.length) {
      for (const [k, v] of keep.slice(0, 12)) {
        if (v == null) continue;
        const val = typeof v === 'object' ? jsonBlock(v, 200) : trunc(String(v), 200);
        allFields.push({ name: k, value: val, inline: typeof v !== 'object' });
      }
    }
  }
  return makeEmbed({
    type:  'Success',
    title: `${Emoji.ICSuccess} ${title}`,
    description,
    user,
    thumbnail,
    fields: allFields,
  });
}

export function apiErrEmbed({ title = 'API error', user, message, status = null, body = null }) {
  return makeEmbed({
    type:  'Error',
    title: `${Emoji.ICError} ${title}`,
    description: `> \`${message}\``,
    user,
    fields: [
      fld('Status', status ? code(status) : null),
      body ? { name: 'Response', value: jsonBlock(body, 1000), inline: false } : null,
    ].filter(Boolean),
  });
}
