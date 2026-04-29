// ./Events/Ready.js

import { Events }    from 'discord.js';
import { Log }       from '../Utils/Logger.js';
import { config }    from '../bot.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  Log.Success(`Bot is ready! Logged in as ${client.user.tag}`);
  Log.Debug(`Servering ${client.guilds.cache.size} guild(s) • ${client.commands.size} command(s)`);

  if (!config?.SellAuth?.ApiKey)        Log.Warn('SellAuth.ApiKey is not set — API calls will fail.');
  if (!config?.SellAuth?.DefaultShopId) Log.Warn('SellAuth.DefaultShopId is not set — pass `shop` to commands or set it.');
}
