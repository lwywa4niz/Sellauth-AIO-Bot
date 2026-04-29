// ./Utils/Logger.js

import { EmbedBuilder, WebhookClient } from 'discord.js';
import fs                              from 'fs';

const C_TIME       = '\x1b[38;2;255;15;211m';
const C_SUCCESS    = '\x1b[38;2;107;255;112m';
const C_FAIL       = '\x1b[38;2;245;0;61m';
const C_INFO       = '\x1b[38;2;51;92;255m';
const C_WARN       = '\x1b[38;2;255;113;25m';
const C_DEBUG      = '\x1b[38;2;255;15;211m';
const C_EXTRA      = '\x1b[38;2;238;0;255m';
const C_SUPPORT    = '\x1b[38;2;61;255;212m';
const C_EXTRADEBUG = '\x1b[38;2;205;255;189m';
const C_RESET      = '\x1b[0m';
const C_WHITE      = '\x1b[97m';

const ICONS = {
  SUCCESS:    '+',
  ERROR:      'X',
  INFO:       '*',
  WARN:       '!',
  DEBUG:      '>',
  EXTRA:      '-',
  SUPPORT:    '/',
  EXTRADEBUG: '~',
};

const TERM_COLORS = {
  SUCCESS:    C_SUCCESS,
  ERROR:      C_FAIL,
  INFO:       C_INFO,
  WARN:       C_WARN,
  DEBUG:      C_DEBUG,
  EXTRA:      C_EXTRA,
  SUPPORT:    C_SUPPORT,
  EXTRADEBUG: C_EXTRADEBUG,
};

const WH_COLORS = {
  SUCCESS:    0x6BFF70,
  ERROR:      0xF5003D,
  INFO:       0x335CFF,
  WARN:       0xFF7119,
  DEBUG:      0xFF0FD3,
  EXTRA:      0xEE00FF,
  SUPPORT:    0x3DFFD4,
  EXTRADEBUG: 0xCDFFBD,
};

const TARGET_DEFAULT_COLOR = {
  BotLogs:  WH_COLORS.INFO,
  Commands: WH_COLORS.DEBUG,
  Api:      WH_COLORS.SUPPORT,
  DebugLog: WH_COLORS.DEBUG,
};

function stripAnsi(text) {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

function getTimestamp() {
  return new Date().toTimeString().slice(0, 8);
}

async function getConfig() {
  const mod = await import('../bot.js');
  return mod.config ?? {};
}

function parseColor(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const hex = value.startsWith('#') ? value.slice(1) : value;
    const n   = parseInt(hex, 16);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

class Logger {
  constructor() {
    this.logStream = null;
    this.webhooks  = {};
    this._client   = null;
  }

  setClient(client)         { this._client = client; }
  setLogFile(filename)      { this.logStream = fs.createWriteStream(filename, { flags: 'a', encoding: 'utf8' }); }
  setWebhooks(webhookMap)   { this.webhooks = webhookMap; }

  _log(level, message) {
    const icon  = ICONS[level]       ?? '*';
    const color = TERM_COLORS[level] ?? C_INFO;
    const ts    = getTimestamp();
    const logLine = `${C_WHITE}[${C_TIME}${ts}${C_WHITE}] (${color}${icon}${C_WHITE}) ${color}${message}${C_RESET}`;

    console.log(logLine);
    if (this.logStream) this.logStream.write(stripAnsi(logLine) + '\n');

    const webhookUrl = this.webhooks[level] ?? this.webhooks['Logs'] ?? null;
    if (webhookUrl) {
      const cleanMsg = stripAnsi(message);
      const whColor  = WH_COLORS[level] ?? 0x5865F2;
      const embed = new EmbedBuilder()
        .setDescription(`\`${icon}\` ${cleanMsg}`)
        .setColor(whColor)
        .setFooter({ text: level })
        .setTimestamp();
      try {
        const wh = new WebhookClient({ url: webhookUrl });
        wh.send({ embeds: [embed] }).catch(() => {});
      } catch (e) {
        console.error(`Failed to send ${level} webhook:`, e.message);
      }
    }
  }

  Success(message)    { this._log('SUCCESS',    message); }
  Error(message)      { this._log('ERROR',      message); }
  Info(message)       { this._log('INFO',       message); }
  Warn(message)       { this._log('WARN',       message); }
  Debug(message)      { this._log('DEBUG',      message); }
  Extra(message)      { this._log('EXTRA',      message); }
  Support(message)    { this._log('SUPPORT',    message); }
  ExtraDebug(message) { this._log('EXTRADEBUG', message); }

  _buildEmbed(opts, cfg) {
    const {
      target, type, title, description, color,
      user, thumbnail, image, fields,
      footerText, footerIcon, timestamp,
    } = opts;

    const colourMap = cfg?.Discord?.Embeds?.Colour ?? {};
    const footerCfg = cfg?.Discord?.Embeds?.Footer ?? {};

    const fallback   = TARGET_DEFAULT_COLOR[target] ?? WH_COLORS.INFO;
    const typeColour = type ? parseColor(colourMap[type], null) : null;
    const finalColor = parseColor(color, typeColour ?? fallback);

    const embed = new EmbedBuilder().setColor(finalColor);
    if (title)       embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (image)       embed.setImage(image);

    const thumb = thumbnail ?? user?.displayAvatarURL?.({ dynamic: true }) ?? null;
    if (thumb) embed.setThumbnail(thumb);

    if (Array.isArray(fields) && fields.length) embed.addFields(fields);

    embed.setFooter({
      text:    footerText ?? footerCfg.Text ?? 'Sellauth AIO',
      iconURL: footerIcon ?? footerCfg.Icon ?? null,
    });

    const useTs = timestamp ?? footerCfg.Timestamp ?? true;
    if (useTs) embed.setTimestamp();

    return embed;
  }

  async toChannel(target, opts = {}) {
    let cfg;
    try { cfg = await getConfig(); } catch { return; }

    const targetCfg = cfg?.LogSettings?.[target];
    if (!targetCfg?.Enable) return;

    const embed = this._buildEmbed({ ...opts, target }, cfg);

    try {
      if (targetCfg.Type === 'Webhook') {
        const url = (targetCfg.Webhook ?? '').trim();
        if (!url) return;
        const wh = new WebhookClient({ url });
        await wh.send({ embeds: [embed] });
      } else {
        const id = (targetCfg.ChannelID ?? '').trim();
        if (!id || !this._client) return;
        const channel = await this._client.channels.fetch(id).catch(() => null);
        if (channel?.isTextBased?.()) await channel.send({ embeds: [embed] });
      }
    } catch (err) {
      this.Warn(`Failed to send ${target} log: ${err.message}`);
    }
  }

  Bot(opts)     { return this.toChannel('BotLogs',  opts); }
  Command(opts) { return this.toChannel('Commands', opts); }
  Api(opts)     { return this.toChannel('Api',      opts); }
  Debugc(opts)  { return this.toChannel('DebugLog', opts); }
}

export const Log = new Logger();
