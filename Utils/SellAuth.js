// ./Utils/SellAuth.js
//
// Thin wrapper around the SellAuth REST API. Every command goes through this
// so retries / logging / shop-id resolution / errors live in one place.
//
// Usage:
//   import { sa } from '../Utils/SellAuth.js';
//   const products = await sa.get(`/shops/${shopId}/products`, { params: { perPage: 10 } });

import axios      from 'axios';
import FormData   from 'form-data';
import fs         from 'fs';
import { config } from '../bot.js';
import { Log }    from './Logger.js';

function saCfg()       { return config?.SellAuth ?? {}; }
export function defaultShopId() {
  const id = saCfg().DefaultShopId;
  return id ? String(id) : null;
}
export function perPage() { return Number(saCfg().PerPage ?? 15); }

/**
 * Resolve the shopId to use. Prefers the explicit override, falls back to the
 * config default. Throws if neither is set.
 */
export function resolveShopId(override) {
  const v = override != null && override !== '' ? String(override) : defaultShopId();
  if (!v) throw new Error('No shop ID configured. Set `SellAuth.DefaultShopId` in Config.yaml or pass `shop` to the command.');
  return v;
}

function buildClient() {
  const cfg = saCfg();
  const apiKey = cfg.ApiKey;
  if (!apiKey) {
    throw new Error('SellAuth API key not configured — set `SellAuth.ApiKey` in Config.yaml.');
  }
  return axios.create({
    baseURL: cfg.BaseURL || 'https://api.sellauth.com/v1',
    timeout: Number(cfg.Timeout ?? 15000),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept':        'application/json',
    },
    validateStatus: () => true, // we'll inspect status manually
  });
}

let _client = null;
function client() { return _client ??= buildClient(); }

/** Reset cached axios client — call after reloading config in dev. */
export function resetClient() { _client = null; }

/**
 * @typedef {object} ApiError
 * @property {boolean} ok
 * @property {number}  status
 * @property {string}  message
 * @property {*}       data
 * @property {*}       body
 */

function shouldRetry(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function request(method, path, { params, data, headers, retries = 2, ...rest } = {}) {
  const cli = client();
  let attempt = 0;
  let lastResponse;

  while (true) {
    attempt++;
    let res;
    try {
      res = await cli.request({ method, url: path, params, data, headers, ...rest });
    } catch (err) {
      // network / timeout / DNS — wrap as a synthetic 0 response so the rest
      // of the error path stays uniform.
      const synthetic = { status: 0, data: { message: err.message }, headers: {} };
      Log.Warn(`[SellAuth] ${method} ${path} failed (network): ${err.message}`);
      if (attempt > retries + 1) throw asError(method, path, synthetic);
      await sleep(500 * attempt);
      continue;
    }

    lastResponse = res;
    if (shouldRetry(res.status) && attempt <= retries) {
      const wait = res.headers?.['retry-after'] ? Number(res.headers['retry-after']) * 1000 : 1000 * attempt;
      Log.Warn(`[SellAuth] ${method} ${path} → ${res.status}, retry ${attempt}/${retries} in ${wait}ms`);
      await sleep(wait);
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      Log.Debug(`[SellAuth] ${method} ${path} → ${res.status}`);
      return res.data;
    }

    throw asError(method, path, res);
  }
}

function asError(method, path, res) {
  const data    = res?.data;
  const message =
    (typeof data === 'string' && data) ||
    data?.message ||
    data?.error ||
    `${method} ${path} failed (${res?.status ?? 'no-response'})`;

  const err     = new Error(message);
  err.isSellAuth = true;
  err.status    = res?.status ?? 0;
  err.body      = data ?? null;
  err.path      = path;
  err.method    = method;
  return err;
}

export const sa = {
  request,
  get:    (path, opts = {}) => request('GET',    path, opts),
  post:   (path, body, opts = {}) => request('POST',   path, { ...opts, data: body }),
  put:    (path, body, opts = {}) => request('PUT',    path, { ...opts, data: body }),
  delete: (path, opts = {}) => request('DELETE', path, opts),

  /**
   * Multipart upload helper for image endpoints.
   * @param {string} path
   * @param {{ filePath?: string, fileBuffer?: Buffer, fileName?: string, fieldName?: string, extra?: object }} opts
   */
  async upload(path, { filePath, fileBuffer, fileName, fieldName = 'image', extra = {} } = {}) {
    const fd = new FormData();
    if (filePath) {
      fd.append(fieldName, fs.createReadStream(filePath), fileName ?? undefined);
    } else if (fileBuffer) {
      fd.append(fieldName, fileBuffer, fileName ?? 'upload.bin');
    } else {
      throw new Error('upload() needs filePath or fileBuffer');
    }
    for (const [k, v] of Object.entries(extra)) fd.append(k, v);

    const cli = client();
    const res = await cli.request({
      method: 'POST',
      url:    path,
      data:   fd,
      headers: fd.getHeaders(),
    });
    if (res.status < 200 || res.status >= 300) throw asError('POST', path, res);
    return res.data;
  },
};

/**
 * Build a query-string params object from a list of [key, value] pairs,
 * dropping null/undefined/empty entries.
 */
export function qs(...pairs) {
  const out = {};
  for (const [k, v] of pairs) {
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

/** Split a comma-separated string option into a clean array. */
export function csv(s) {
  if (!s) return [];
  return String(s).split(',').map(x => x.trim()).filter(Boolean);
}

/** Convert "1,2,3" to [1,2,3] (numbers). Used for ID arrays. */
export function csvNum(s) {
  return csv(s).map(Number).filter(n => Number.isFinite(n));
}
