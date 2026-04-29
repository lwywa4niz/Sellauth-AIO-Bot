// ./Commands/Crypto.js

import { SlashCommandBuilder }                           from 'discord.js';
import { ctxFromInteraction }                            from '../Utils/Commands.js';
import { sa, resolveShopId }                             from '../Utils/SellAuth.js';
import { runApi, runListApi, renderItem, renderOk, Row } from '../Utils/ApiCommand.js';
import { guardSuperUser }                                from '../Utils/Permissions.js';
import { handleAutocomplete }                            from '../Utils/Autocomplete.js';

export const category = 'Crypto Wallet';

const shopOpt = (o) => o.setName('shop').setDescription('Shop ID').setRequired(false).setAutocomplete(true);

export const data = new SlashCommandBuilder()
  .setName('crypto')
  .setDescription('[Owner] SellAuth — crypto wallet (payouts)')

  .addSubcommand(s => s.setName('payouts').setDescription('Payout history').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('balances').setDescription('Current balances').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('transactions').setDescription('Transaction history').addStringOption(shopOpt))
  .addSubcommand(s => s.setName('payout').setDescription('Send a payout')
    .addStringOption(o => o.setName('currency').setDescription('Currency').setRequired(true))
    .addStringOption(o => o.setName('address').setDescription('Wallet address').setRequired(true))
    .addNumberOption(o => o.setName('amount').setDescription('Amount').setRequired(true))
    .addStringOption(o => o.setName('password').setDescription('Account password').setRequired(true))
    .addStringOption(o => o.setName('otp').setDescription('OTP'))
    .addStringOption(o => o.setName('tfa_code').setDescription('2FA code'))
    .addBooleanOption(o => o.setName('remember_mfa').setDescription('Remember MFA'))
    .addStringOption(shopOpt));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sub = interaction.options.getSubcommand();
  const sid = resolveShopId(interaction.options.getString('shop'));

  if (sub === 'payouts') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/payouts`,
      title:    `Payouts — shop ${sid}`,
      row: (po, i) => ({
        name:  `\`${i+1}.\` ${po.currency ?? '?'} ${po.amount ?? ''} — \`${po.id}\``,
        value: [
          `> Status: \`${po.status ?? '-'}\``,
          `> Address: \`${(po.address ?? '').slice(0, 40)}\``,
          `> Created: ${Row.rel(po.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }
  if (sub === 'balances') {
    return runApi(ctx, () => sa.get(`/shops/${sid}/payouts/balances`), {
      title: 'Balances', render: (p) => renderItem(ctx, p, { title: `Balances — shop ${sid}`, showRaw: true }),
    });
  }
  if (sub === 'transactions') {
    return runListApi(ctx, {
      endpoint: `/shops/${sid}/payouts/transactions`,
      title:    `Transactions — shop ${sid}`,
      row: (t, i) => ({
        name:  `\`${i+1}.\` ${t.type ?? '?'} ${t.currency ?? ''} \`${t.amount ?? ''}\``,
        value: [
          `> Status: \`${t.status ?? '-'}\``,
          `> Created: ${Row.rel(t.created_at)}`,
        ].join('\n'),
        inline: true,
      }),
    });
  }
  if (sub === 'payout') {
    const body = {
      currency:     interaction.options.getString('currency'),
      address:      interaction.options.getString('address'),
      amount:       interaction.options.getNumber('amount'),
      password:     interaction.options.getString('password'),
      otp:          interaction.options.getString('otp')        ?? undefined,
      tfa_code:     interaction.options.getString('tfa_code')   ?? undefined,
      remember_mfa: interaction.options.getBoolean('remember_mfa') ?? undefined,
    };
    return runApi(ctx, () => sa.post(`/shops/${sid}/payouts/payout`, body), {
      title: 'Payout', render: (p) => renderOk(ctx, { title: 'Payout request sent', data: p }),
    });
  }
}

export const autocomplete = handleAutocomplete;

export default { data, execute, autocomplete, category };
