// ./Events/MessageCreate.js

import { Events }            from 'discord.js';
import { config }            from '../bot.js';
import { Log }               from '../Utils/Logger.js';
import { makeEmbed, Emoji }  from '../Utils/Embeds.js';
import { checkCooldown }     from '../Utils/Time.js';

export const name = Events.MessageCreate;
export const once = false;

async function replyError(message, description) {
  const embed = makeEmbed({
    type: 'Error',
    title: `${Emoji.ICError} Error`,
    description: `> ${description}`,
    user: message.author,
  });
  return message.channel.send({ embeds: [embed] }).catch(() => {});
}

export async function execute(message) {
  if (message.author.bot || !message.guild) return;

  const prefix = config?.Discord?.BotPrefix ?? '!';
  if (!message.content.startsWith(prefix)) return;

  const args        = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = message.client.commands.find(cmd => {
    if (cmd.data?.name === commandName) return true;
    if (Array.isArray(cmd.aliases) && cmd.aliases.includes(commandName)) return true;
    return false;
  });
  if (!command) return;

  if (config?.CommandsSettings?.EnablePrefix === false) {
    return replyError(message, 'Prefix commands are **disabled** in `Config.yaml`.');
  }
  if (typeof command.executePrefix !== 'function') {
    return replyError(message, 'This command does not support prefix — use slash `/` instead.');
  }

  if (message.member) {
    const cd = checkCooldown(command.data.name, message.member);
    if (!cd.ok) return replyError(message, `Cooldown — try again in **${cd.remaining}s**.`);
  }

  try { await command.executePrefix(message, args); }
  catch (err) {
    Log.Error(`Prefix command "${commandName}" threw: ${err.message}`);
    return replyError(message, `An error occurred: \`${err.message}\``);
  }
}
