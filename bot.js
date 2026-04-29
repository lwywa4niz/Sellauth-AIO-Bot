// ./bot.js

import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js';
import { readFileSync }                                                  from 'fs';
import yaml                                                              from 'js-yaml';
import { Log }                                                           from './Utils/Logger.js';

export const config = yaml.load(readFileSync('./Config.yaml', 'utf8'));

const discord = config.Discord;

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

Log.setClient(client);

client.commands     = new Collection();
client.interactions = new Collection();

const STATUS_MAP = {
  ONLINE:    'online',
  IDLE:      'idle',
  DND:       'dnd',
  INVISIBLE: 'invisible',
};

const ACTIVITY_MAP = {
  PLAYING:   ActivityType.Playing,
  STREAMING: ActivityType.Streaming,
  LISTENING: ActivityType.Listening,
  WATCHING:  ActivityType.Watching,
  COMPETING: ActivityType.Competing,
};

client.once('clientReady', () => {
  Log.Success(`Logged in as ${client.user.tag}`);

  const status   = STATUS_MAP[discord.BotStatus?.Status?.toUpperCase()] ?? 'online';
  const actType  = ACTIVITY_MAP[discord.BotActivity?.Type?.toUpperCase()] ?? ActivityType.Watching;
  const baseText = discord.BotActivity?.Text || 'sellauth.com';

  function updatePresence() {
    const servers  = client.guilds.cache.size;
    const commands = client.commands.size;
    client.user.setPresence({
      activities: [{
        name: `${baseText} | ${servers} server(s) • ${commands} cmds`,
        type: actType,
      }],
      status,
    });
  }

  updatePresence();
  setInterval(updatePresence, 60_000);
});

export async function startBot() {
  await client.login(discord.BotToken);
}
