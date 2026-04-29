// ./Utils/ApiCommand.js
//
// Shared scaffold for SellAuth-API-wrapping commands. Provides:
//   • runApi(ctx, fn, { title, render })  — defer + call + render success/error
//   • runListApi(ctx, { endpoint, ... })  — fetch + render list + page buttons
//   • renderList / renderItem / renderOk  — direct embed builders
//   • Pagination session store + helpers (used by Interactions/Paginate.js)

import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Log }                                          from './Logger.js';
import { sa }                                           from './SellAuth.js';
import { makeEmbed, Emoji, fld, code,
         trunc, jsonBlock, relTime,
         apiOkEmbed, apiErrEmbed }             from './Embeds.js';

// ─────────────────────────────── Helpers ─────────────────────────────────────

export function pickRows(payload) {
  if (Array.isArray(payload))          return payload;
  if (Array.isArray(payload?.data))    return payload.data;
  if (Array.isArray(payload?.items))   return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

export function pickMeta(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const m = {
    current_page: payload.current_page ?? payload.meta?.current_page,
    last_page:    payload.last_page    ?? payload.meta?.last_page,
    total:        payload.total        ?? payload.meta?.total,
    per_page:     payload.per_page     ?? payload.meta?.per_page,
  };
  if (m.current_page == null && m.total == null) return null;
  return m;
}

// ─────────────────────────── Pagination sessions ─────────────────────────────
//
// Each list response builds an ephemeral session keyed by an 8-char ID,
// stored in-memory. The buttons reference this ID; on click the handler
// re-fetches with the new page number and updates the message.
//
// We store the rendering closure (title/row/empty) alongside endpoint+params
// so re-rendering after a page flip stays consistent with the original list.

const _sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function makeSessionId() {
  return Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);
}

export function saveSession(data) {
  const id = makeSessionId();
  _sessions.set(id, { ...data, ts: Date.now() });
  if (_sessions.size > 500) {
    const now = Date.now();
    for (const [k, v] of _sessions) if (now - v.ts > SESSION_TTL) _sessions.delete(k);
  }
  return id;
}

export function getSession(id) {
  const s = _sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.ts > SESSION_TTL) { _sessions.delete(id); return null; }
  s.ts = Date.now();
  return s;
}

export function buildPageButtons(sessionId, page, totalPages) {
  if (!totalPages || totalPages <= 1) return null;
  const back = new ButtonBuilder()
    .setCustomId(`pg:${sessionId}:back`)
    .setLabel('◀ Previous')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page <= 1);

  const indicator = new ButtonBuilder()
    .setCustomId(`pg:${sessionId}:noop`)
    .setLabel(`Page ${page} / ${totalPages}`)
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const next = new ButtonBuilder()
    .setCustomId(`pg:${sessionId}:next`)
    .setLabel('Next ▶')
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page >= totalPages);

  return new ActionRowBuilder().addComponents(back, indicator, next);
}

/**
 * Build the embed shown for a list page. Used by both runListApi and the
 * Paginate interaction handler so the layout stays identical across navigations.
 */
export function buildListEmbed({ rows, meta, page, title, row, user, limit = 15, empty }) {
  if (!rows || !rows.length) {
    return makeEmbed({
      type:        'Warn',
      title:       `${Emoji.ICWarn} ${title}`,
      description: `> ${empty ?? 'No data.'}`,
      user,
    });
  }

  const fields = rows.slice(0, limit).map((r, i) => row(r, i)).filter(Boolean);
  const desc = meta
    ? `> Page \`${meta.current_page ?? page} / ${meta.last_page ?? '?'}\` • Total \`${meta.total ?? rows.length}\``
    : `> Showing \`${Math.min(rows.length, limit)} / ${rows.length}\``;

  return makeEmbed({
    type:        'Debug',
    title:       `${Emoji.ICDebug} ${title}`,
    description: desc,
    user,
    fields,
  });
}

// ──────────────────────────────── runApi ─────────────────────────────────────

export async function runApi(ctx, fn, { title, render, logTag = '' }) {
  await ctx.defer({ ephemeral: ctx.ephemeral ?? true });
  try {
    const payload = await fn();
    return await render(payload);
  } catch (err) {
    if (err?.isSellAuth) {
      Log.Warn(`[${logTag || title}] ${err.method} ${err.path} → ${err.status}: ${err.message}`);
      return ctx.replyEmbed(
        apiErrEmbed({ title, user: ctx.user, message: err.message, status: err.status, body: err.body }),
      );
    }
    Log.Error(`[${logTag || title}] ${err.message}`);
    return ctx.replyEmbed(
      makeEmbed({ type: 'Error', title: `${Emoji.ICError} ${title}`, description: `> \`${err.message}\``, user: ctx.user }),
    );
  }
}

/**
 * Fetch a list endpoint, render with prev/next page buttons, and stash the
 * needed context in a session so the Paginate handler can flip pages later.
 *
 * @param {object} ctx
 * @param {{
 *   endpoint:  string,
 *   params?:   object,
 *   title:     string,
 *   row:       (row: any, i: number) => { name: string, value: string, inline?: boolean },
 *   empty?:    string,
 *   limit?:    number,
 *   logTag?:   string,
 * }} opts
 */
export async function runListApi(ctx, { endpoint, params = {}, title, row, empty, limit = 15, logTag = '' }) {
  await ctx.defer({ ephemeral: ctx.ephemeral ?? true });
  const startPage = Number(params.page ?? 1);
  const baseParams = { ...params };
  delete baseParams.page;

  try {
    const payload = await sa.get(endpoint, { params: { ...baseParams, page: startPage } });
    const rows    = pickRows(payload);
    const meta    = pickMeta(payload);
    const totalPages = meta?.last_page ?? 1;

    const sessionId = saveSession({
      endpoint, baseParams, page: startPage, totalPages,
      title, row, empty, limit, userId: ctx.user.id,
    });

    const embed   = buildListEmbed({ rows, meta, page: startPage, title, row, user: ctx.user, limit, empty });
    const buttons = buildPageButtons(sessionId, startPage, totalPages);
    const components = buttons ? [buttons] : [];
    return ctx.replyEmbed(embed, { components });
  } catch (err) {
    if (err?.isSellAuth) {
      Log.Warn(`[${logTag || title}] ${err.method} ${err.path} → ${err.status}: ${err.message}`);
      return ctx.replyEmbed(
        apiErrEmbed({ title, user: ctx.user, message: err.message, status: err.status, body: err.body }),
      );
    }
    Log.Error(`[${logTag || title}] ${err.message}`);
    return ctx.replyEmbed(
      makeEmbed({ type: 'Error', title: `${Emoji.ICError} ${title}`, description: `> \`${err.message}\``, user: ctx.user }),
    );
  }
}

// ──────────────────────────── Direct renderers ───────────────────────────────

export async function renderList(ctx, payload, { title, row, empty = 'No data.', limit = 15, raw = false }) {
  const rows = pickRows(payload);
  const meta = pickMeta(payload);
  const embed = buildListEmbed({ rows, meta, page: meta?.current_page ?? 1, title, row, user: ctx.user, limit, empty });
  if (raw) embed.addFields({ name: 'Raw', value: jsonBlock(payload, 1000), inline: false });
  return ctx.replyEmbed(embed);
}

export async function renderItem(ctx, item, { title, keys = [], showRaw = false }) {
  if (!item || typeof item !== 'object') {
    return ctx.replyEmbed(
      makeEmbed({
        type: 'Warn', title: `${Emoji.ICWarn} ${title}`,
        description: '> No data.', user: ctx.user,
      }),
    );
  }
  const data = item.data ?? item;
  const fields = keys.map(([k, label, fmt]) => {
    const raw = data?.[k];
    if (raw === undefined || raw === null || raw === '') return null;
    const value = fmt ? fmt(raw, data) : (typeof raw === 'object' ? jsonBlock(raw, 200) : trunc(String(raw), 200));
    return { name: label, value, inline: typeof raw !== 'object' };
  }).filter(Boolean);

  const embed = apiOkEmbed({
    title,
    user:   ctx.user,
    fields,
    raw:    fields.length === 0 ? data : null,
  });
  if (showRaw) embed.addFields({ name: 'Raw', value: jsonBlock(data, 1000), inline: false });
  return ctx.replyEmbed(embed);
}

export async function renderOk(ctx, { title, description = null, fields = [], data = null }) {
  return ctx.replyEmbed(
    apiOkEmbed({ title, user: ctx.user, description, fields, raw: data }),
  );
}

export const Row = { rel: relTime, fld, code, trunc, jsonBlock };
