// ./Utils/Autocomplete.js
//
// Generic autocomplete handler shared by every command. Each command does:
//
//     export { handleAutocomplete as autocomplete } from '../Utils/Autocomplete.js';
//
// The handler inspects which option is being focused, fetches the matching
// resource list (cached for ~20s), and returns up to 25 suggestions filtered
// by the user's current input.

import { sa, defaultShopId } from './SellAuth.js';
import { Log }               from './Logger.js';

const _cache = new Map(); // key → { data, expiry }
const TTL    = 20_000;

async function cached(key, fetcher) {
  const c = _cache.get(key);
  if (c && c.expiry > Date.now()) return c.data;
  try {
    const data = await fetcher();
    _cache.set(key, { data, expiry: Date.now() + TTL });
    return data;
  } catch (err) {
    Log.Debug(`[autocomplete] ${key} fetch failed: ${err.message}`);
    return [];
  }
}

function pickRows(payload) {
  if (Array.isArray(payload))         return payload;
  if (Array.isArray(payload?.data))   return payload.data;
  if (Array.isArray(payload?.items))  return payload.items;
  return [];
}

function filt(rows, query, keys) {
  const q = (query ?? '').toString().toLowerCase().trim();
  if (!q) return rows;
  return rows.filter(r =>
    keys.some(k => String(r?.[k] ?? '').toLowerCase().includes(q)) ||
    String(r?.id ?? '').toLowerCase().includes(q),
  );
}

function format(rows, label, max = 25) {
  return rows.slice(0, max).map(r => {
    const name = String(label(r) ?? r.id ?? '?').slice(0, 100);
    return { name, value: String(r.id) };
  });
}

// Resource map for shop-scoped IDs.
//   path : URL segment after /shops/{sid}/
//   label: function to format display name
//   keys : columns to filter against
const SHOP_RESOURCES = {
  product_id:   { path: 'products',        label: r => `${r.name ?? '?'} • ID ${r.id}`,                                 keys: ['name', 'path'] },
  customer_id:  { path: 'customers',       label: r => `${r.email ?? '?'} • ID ${r.id}`,                                keys: ['email', 'discord_id'] },
  invoice_id:   { path: 'invoices',        label: r => `${r.email ?? r.id} • ${r.status ?? ''} • ID ${r.id}`,           keys: ['email', 'status'] },
  coupon_id:    { path: 'coupons',         label: r => `${r.code ?? '?'} • -${r.discount ?? '?'} • ID ${r.id}`,         keys: ['code'] },
  category_id:  { path: 'categories',      label: r => `${r.name ?? '?'} • ID ${r.id}`,                                 keys: ['name', 'path'] },
  post_id:      { path: 'blog-posts',      label: r => `${r.title ?? '?'} • ID ${r.id}`,                                keys: ['title', 'path'] },
  group_id:     { path: 'groups',          label: r => `${r.name ?? '?'} • ID ${r.id}`,                                 keys: ['name'] },
  blacklist_id: { path: 'blacklist',       label: r => `${r.type ?? '?'}: ${(r.value ?? '').slice(0, 40)} • ID ${r.id}`, keys: ['value', 'type'] },
  ticket_id:    { path: 'tickets',         label: r => `${(r.subject ?? '?').slice(0, 60)} • ID ${r.id}`,               keys: ['subject', 'customer_email'] },
  method_id:    { path: 'payment-methods', label: r => `${r.name ?? r.type ?? '?'} • ID ${r.id}`,                       keys: ['name', 'type'] },
  field_id:     { path: 'custom-fields',   label: r => `${r.name ?? '?'} (${r.type ?? '-'}) • ID ${r.id}`,              keys: ['name', 'type'] },
  domain_id:    { path: 'domains',         label: r => `${r.domain ?? '?'} • ID ${r.id}`,                               keys: ['domain'] },
  image_id:     { path: 'images',          label: r => `${r.filename ?? r.name ?? '?'} • ID ${r.id}`,                   keys: ['filename', 'name'] },
  feedback_id:  { path: 'feedbacks',       label: r => `${'⭐'.repeat(r.rating ?? 0)} ${r.status ?? ''} • ID ${r.id}`,  keys: ['status'] },
};

/**
 * Generic autocomplete handler. Re-exported by every command file as
 * `export { handleAutocomplete as autocomplete } from '...';`
 *
 * @param {import('discord.js').AutocompleteInteraction} interaction
 */
export async function handleAutocomplete(interaction) {
  try {
    const focused = interaction.options.getFocused(true);
    if (!focused?.name) return interaction.respond([]).catch(() => {});

    // Resolve shop: option > config default.
    let sid;
    try { sid = interaction.options.getString('shop') ?? null; }
    catch { sid = null; }
    sid = sid || defaultShopId();

    // Shop list — works without a default shop set.
    if (focused.name === 'shop' || focused.name === 'shop_id') {
      const payload = await cached('shops', () => sa.get('/shops'));
      const rows    = pickRows(payload);
      const matched = filt(rows, focused.value, ['name', 'subdomain']);
      return interaction.respond(format(matched, r => `${r.name ?? '?'} • ${r.subdomain ?? '-'} • ID ${r.id}`)).catch(() => {});
    }

    if (!sid) return interaction.respond([]).catch(() => {});

    const cfg = SHOP_RESOURCES[focused.name];
    if (!cfg) return interaction.respond([]).catch(() => {});

    const payload = await cached(`${sid}:${cfg.path}`, () =>
      sa.get(`/shops/${sid}/${cfg.path}`, { params: { perPage: 50 } }),
    );
    const rows    = pickRows(payload);
    const matched = filt(rows, focused.value, cfg.keys);
    return interaction.respond(format(matched, cfg.label)).catch(() => {});
  } catch (err) {
    Log.Debug(`[autocomplete] failed: ${err.message}`);
    try { await interaction.respond([]); } catch {}
  }
}

/**
 * Drop the autocomplete cache. Useful after mutations.
 */
export function invalidateAutocomplete(scope = null) {
  if (!scope) { _cache.clear(); return; }
  for (const key of [..._cache.keys()]) {
    if (key.includes(scope)) _cache.delete(key);
  }
}
