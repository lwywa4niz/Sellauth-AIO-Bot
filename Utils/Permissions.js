// ./Utils/Permissions.js

import { MessageFlags } from 'discord.js';
import { config }       from '../bot.js';
import { makeEmbed, Emoji } from './Embeds.js';

export function isOwner(userId) {
  const u = config?.Discord?.Users ?? {};
  const ids = [...(u.Owners ?? []), ...(u.ExtraOwners ?? [])].filter(Boolean);
  return ids.includes(String(userId));
}

export function isDeveloper(userId) {
  const ids = (config?.Discord?.Users?.Developers ?? []).filter(Boolean);
  return ids.includes(String(userId));
}

export function isSuperUser(userId) {
  return isOwner(userId) || isDeveloper(userId);
}

/**
 * Reply with a permission-denied embed. Returns false so callers can early-exit:
 *   if (!await guardSuperUser(ctx)) return;
 */
export async function guardSuperUser(ctx) {
  if (isSuperUser(ctx.user.id)) return true;
  await ctx.replyEmbed(
    makeEmbed({
      type:        'Error',
      title:       `${Emoji.ICError} Permission denied`,
      description: '> This command is for **Owners / Developers** only.',
      user:        ctx.user,
    }),
    { flags: MessageFlags.Ephemeral },
  );
  return false;
}
