// ./Utils/Time.js

import { config } from '../bot.js';

const hits = new Map();

function cooldownCfg() { return config?.CommandsSettings?.Cooldown ?? {}; }

function isIgnoredGuild(guildId) {
  const ids = (cooldownCfg().Ignore?.Guild ?? []).filter(Boolean);
  return guildId && ids.includes(guildId);
}

function isIgnoredUser(userId) {
  const ids = (cooldownCfg().Ignore?.Users ?? []).filter(Boolean);
  return userId && ids.includes(userId);
}

function isSuperUser(member) {
  if (!member) return false;
  const users = config?.Discord?.Users ?? {};
  const ids = [
    ...(users.Owners      ?? []),
    ...(users.Developers  ?? []),
    ...(users.ExtraOwners ?? []),
  ].filter(Boolean);
  return ids.includes(member.user?.id ?? member.id);
}

export function isBotSuperUser(member) { return isSuperUser(member); }

export function secondsForMember(member) {
  const cfg = cooldownCfg();
  if (!member) return Number(cfg.PerUser ?? 0);
  if (isSuperUser(member)) return 0;
  if (isIgnoredUser(member.user?.id)) return 0;
  if (isIgnoredGuild(member.guild?.id)) return 0;

  const staffRoles = config?.Discord?.StaffRoles ?? [];
  const roles = member.roles?.cache;
  const isStaff = roles && staffRoles.some(id => roles.has(id));
  return isStaff ? Number(cfg.PerStaff ?? 0) : Number(cfg.PerUser ?? 0);
}

export function checkCooldown(commandName, member) {
  const seconds = secondsForMember(member);
  if (!seconds || seconds <= 0) return { ok: true };

  const key = `${commandName}:${member.user.id}`;
  const now = Date.now();
  const hit = hits.get(key);
  if (hit && hit > now) return { ok: false, remaining: Math.ceil((hit - now) / 1000) };
  hits.set(key, now + seconds * 1000);

  if (hits.size > 2000) {
    for (const [k, expires] of hits) if (expires <= now) hits.delete(k);
  }
  return { ok: true };
}

export function clearCooldown(commandName, userId) {
  hits.delete(`${commandName}:${userId}`);
}
