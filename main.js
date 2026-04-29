// ./main.js

import { readdirSync }                from 'fs';
import { join, dirname }              from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { REST, Routes }               from 'discord.js';
import { client, config, startBot }   from './bot.js';
import { Log }                        from './Utils/Logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function collectEventFiles() {
  const eventsPath = join(__dirname, 'Events');
  const entries    = readdirSync(eventsPath, { withFileTypes: true });
  const files      = [];

  for (const entry of entries) {
    const fullPath = join(eventsPath, entry.name);

    if (entry.isDirectory()) {
      let subFiles;
      try { subFiles = readdirSync(fullPath, { withFileTypes: true }); } catch { continue; }
      const jsFiles  = subFiles.filter(e => e.isFile() && e.name.endsWith('.js'));
      const indexFile = jsFiles.find(e => e.name.toLowerCase() === 'index.js');

      if (indexFile) files.push(join(fullPath, indexFile.name));
      else for (const jsFile of jsFiles) files.push(join(fullPath, jsFile.name));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadEvents() {
  const filePaths = collectEventFiles();
  for (const absPath of filePaths) {
    const fileUrl = pathToFileURL(absPath).href;
    try {
      const event = await import(fileUrl);
      if (!event.name || typeof event.execute !== 'function') {
        Log.Warn(`Skipping event file (no name/execute): ${absPath}`);
        continue;
      }
      if (event.once) client.once(event.name, (...args) => event.execute(...args));
      else            client.on(event.name,   (...args) => event.execute(...args));

      const label = absPath.split(/[\\/]+Events[\\/]+/).pop().replace(/\.js$/, '');
      Log.Debug(`Event loaded: [${label}] → ${event.name}`);
    } catch (err) {
      Log.Error(`Failed to load event at ${absPath}: ${err.message}`);
    }
  }
}

function collectCommandFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files   = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const subEntries = readdirSync(fullPath, { withFileTypes: true });
      const jsFiles    = subEntries.filter(e => e.isFile() && e.name.endsWith('.js'));
      const hasIndex   = jsFiles.some(e => e.name === 'index.js');
      if (hasIndex) files.push(join(fullPath, 'index.js'));
      else for (const jsFile of jsFiles) files.push(join(fullPath, jsFile.name));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

function inferCategory(absPath) {
  const rel   = absPath.split(/[\\/]+Commands[\\/]+/).pop() ?? '';
  const parts = rel.split(/[\\/]+/);
  if (parts.length > 1) return parts[0];
  return 'SellAuth';
}

async function loadCommands() {
  const commandsPath = join(__dirname, 'Commands');
  const filePaths    = collectCommandFiles(commandsPath);

  for (const absPath of filePaths) {
    const fileUrl = pathToFileURL(absPath).href;
    try {
      const mod     = await import(fileUrl);
      const command = mod.default ?? mod;

      if (!command?.data || !command?.execute) {
        Log.Warn(`Skipping ${absPath} — missing data or execute.`);
        continue;
      }
      command.category = mod.category ?? command.category ?? inferCategory(absPath);
      client.commands.set(command.data.name, command);
      Log.Debug(`Command loaded: /${command.data.name}  [${command.category}]`);
    } catch (err) {
      Log.Error(`Failed to load command at ${absPath}: ${err.message}`);
    }
  }
}

async function registerCommands() {
  const rest     = new REST({ version: '10' }).setToken(config.Discord.BotToken);
  const body     = [...client.commands.values()].map(c => c.data.toJSON());
  const clientId = config.Discord.ClientID;

  try {
    Log.Info(`Registering ${body.length} slash command(s)…`);
    const registered = await rest.put(Routes.applicationCommands(clientId), { body });
    client.commandIds = new Map();
    if (Array.isArray(registered)) {
      for (const cmd of registered) client.commandIds.set(cmd.name, cmd.id);
    }
    Log.Success(`Slash commands registered globally (${client.commandIds.size} IDs cached).`);
  } catch (err) {
    Log.Error(`Failed to register commands: ${err.message}`);
  }
}

async function gracefulShutdown(signal) {
  Log.Warn(`Received ${signal} — shutting down…`);
  try { client.destroy(); } catch {}
  process.exit(0);
}

process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

(async () => {
  try {
    await loadEvents();
    await loadCommands();
    await registerCommands();
    await startBot();
  } catch (err) {
    Log.Error(`Fatal startup error: ${err.message}`);
    process.exit(1);
  }
})();
