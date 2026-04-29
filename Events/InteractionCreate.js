// ./Events/InteractionCreate.js

import { Events, MessageFlags }            from 'discord.js';
import { readdirSync }                     from 'fs';
import { join, dirname }                   from 'path';
import { fileURLToPath, pathToFileURL }    from 'url';
import { config }                          from '../bot.js';
import { Log }                             from '../Utils/Logger.js';
import { makeEmbed, Emoji }                from '../Utils/Embeds.js';
import { checkCooldown }                   from '../Utils/Time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const buttonHandlers       = new Map();
const selectHandlers       = new Map();
const buttonPrefixHandlers = [];
const selectPrefixHandlers = [];

async function loadInteractions() {
  const interactionsPath = join(__dirname, '..', 'Interactions');
  let files;
  try { files = readdirSync(interactionsPath).filter(f => f.endsWith('.js')); }
  catch { return; }

  for (const file of files) {
    const filePath = pathToFileURL(join(interactionsPath, file)).href;
    try {
      const mod = await import(filePath);
      const handler = mod.default ?? mod;
      if (typeof handler?.execute !== 'function' || (!handler.customId && !handler.customIdPrefix)) continue;
      const type = handler.type ?? 'select';
      if (handler.customIdPrefix) {
        if (type === 'button') buttonPrefixHandlers.push(handler);
        else                   selectPrefixHandlers.push(handler);
      } else {
        if (type === 'button') buttonHandlers.set(handler.customId, handler);
        else                   selectHandlers.set(handler.customId, handler);
      }
    } catch (err) {
      Log.Error(`Failed to load Interactions/${file}: ${err.message}`);
    }
  }
  buttonPrefixHandlers.sort((a, b) => b.customIdPrefix.length - a.customIdPrefix.length);
  selectPrefixHandlers.sort((a, b) => b.customIdPrefix.length - a.customIdPrefix.length);
}

await loadInteractions();

function formatSlashUsage(interaction) {
  const parts = [`/${interaction.commandName}`];
  const sub   = interaction.options.getSubcommand?.(false);
  const grp   = interaction.options.getSubcommandGroup?.(false);
  if (grp) parts.push(grp);
  if (sub) parts.push(sub);

  const opts = interaction.options.data?.[0]?.options ?? interaction.options.data ?? [];
  const flat = [];
  const walk = (arr) => {
    for (const o of arr) {
      if (o.options?.length) { walk(o.options); continue; }
      if (o.value === undefined || o.value === null) continue;
      flat.push(`${o.name}:${typeof o.value === 'string' ? `"${o.value}"` : o.value}`);
    }
  };
  walk(opts);
  if (flat.length) parts.push(flat.join(' '));
  return parts.join(' ');
}

async function logSlashCommand(interaction, status, errorMsg = null) {
  const usage = formatSlashUsage(interaction);
  const lines = [
    `> **User:** ${interaction.user} (\`${interaction.user.id}\`)`,
    `> **Command:** \`${usage}\``,
    `> **Channel:** ${interaction.channel ? `${interaction.channel}` : '`DM`'}`,
    `> **Server:** ${interaction.guild ? `${interaction.guild.name} (\`${interaction.guild.id}\`)` : '`DM`'}`,
    `> **Status:** ${status}`,
    errorMsg ? `> **Error:** \`${errorMsg}\`` : null,
  ].filter(Boolean);
  await Log.Command({
    type:        errorMsg ? 'Error' : 'Debug',
    title:       `${errorMsg ? Emoji.ICError : Emoji.ICDebug} Slash Command`,
    description: lines.join('\n'),
    user:        interaction.user,
  });
}

export const name = Events.InteractionCreate;
export const once = false;

async function replyError(interaction, description) {
  const embed = makeEmbed({
    type: 'Error',
    title: `${Emoji.ICError} Error`,
    description: `> ${description}`,
    user: interaction.user,
  });
  const payload = { embeds: [embed], flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) return interaction.editReply(payload).catch(() => {});
  return interaction.reply(payload).catch(() => {});
}

export async function execute(interaction) {
  if (interaction.isAutocomplete()) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try { await command.autocomplete(interaction); }
    catch (err) { Log.Error(`Autocomplete /${interaction.commandName} threw: ${err.message}`); }
    return;
  }

  if (interaction.isChatInputCommand()) {
    if (config?.CommandsSettings?.EnableSlash === false) {
      logSlashCommand(interaction, 'Blocked', 'EnableSlash = false').catch(() => {});
      return replyError(interaction, 'Slash commands are **disabled** in `Config.yaml`.');
    }
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return replyError(interaction, 'Command not found.');

    if (interaction.member) {
      const cd = checkCooldown(interaction.commandName, interaction.member);
      if (!cd.ok) return replyError(interaction, `You are on cooldown — try again in **${cd.remaining}s**.`);
    }

    try {
      await command.execute(interaction);
      logSlashCommand(interaction, 'Success').catch(() => {});
    } catch (err) {
      Log.Error(`Command /${interaction.commandName} threw: ${err.message}`);
      logSlashCommand(interaction, 'Failed', err.message).catch(() => {});
      return replyError(interaction, `An error occurred: \`${err.message}\``);
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const handler = selectHandlers.get(interaction.customId)
      ?? selectPrefixHandlers.find(h => interaction.customId.startsWith(h.customIdPrefix));
    if (handler) {
      try { return await handler.execute(interaction); }
      catch (err) { return replyError(interaction, `An error occurred: \`${err.message}\``); }
    }
    return;
  }

  if (interaction.isButton()) {
    const handler = buttonHandlers.get(interaction.customId)
      ?? buttonPrefixHandlers.find(h => interaction.customId.startsWith(h.customIdPrefix));
    if (handler) {
      try { return await handler.execute(interaction); }
      catch (err) { return replyError(interaction, `An error occurred: \`${err.message}\``); }
    }
  }
}
