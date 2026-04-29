// ./Utils/Commands.js

import { MessageFlags } from 'discord.js';

export function ctxFromInteraction(interaction) {
  const _eph = interaction.options?.getBoolean?.('ephemeral') ?? true;

  return {
    kind:      'slash',
    user:      interaction.user,
    member:    interaction.member,
    guild:     interaction.guild,
    channel:   interaction.channel,
    client:    interaction.client,
    ephemeral: _eph,

    async defer({ ephemeral = _eph } = {}) {
      if (interaction.deferred || interaction.replied) return;
      await interaction.deferReply(ephemeral ? { flags: MessageFlags.Ephemeral } : {}).catch(() => {});
    },

    async reply(payload) {
      if (interaction.deferred || interaction.replied) return interaction.editReply(payload);
      return interaction.reply(payload);
    },

    async followUp(payload) { return interaction.followUp(payload); },

    async replyEmbed(embed, { ephemeral = _eph, flags, components } = {}) {
      const payload = { embeds: [embed] };
      if (Array.isArray(components) && components.length) payload.components = components;
      // Caller-supplied flags win; otherwise honour `ephemeral` shorthand.
      if (flags !== undefined)  payload.flags = flags;
      else if (ephemeral)       payload.flags = MessageFlags.Ephemeral;
      return this.reply(payload);
    },
  };
}

export function ctxFromMessage(message) {
  return {
    kind:    'prefix',
    user:    message.author,
    member:  message.member,
    guild:   message.guild,
    channel: message.channel,
    client:  message.client,

    async defer() { /* no-op */ },

    async reply(payload) {
      const { flags: _flags, ...rest } = payload ?? {};
      return message.channel.send(rest).catch(() => null);
    },

    async followUp(payload) {
      const { flags: _flags, ...rest } = payload ?? {};
      return message.channel.send(rest).catch(() => null);
    },

    async replyEmbed(embed, { components } = {}) {
      const payload = { embeds: [embed] };
      if (Array.isArray(components) && components.length) payload.components = components;
      return message.channel.send(payload).catch(() => null);
    },
  };
}
