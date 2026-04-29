// ./Commands/Checkout.js

import { SlashCommandBuilder }                 from 'discord.js';
import { ctxFromInteraction }                  from '../Utils/Commands.js';
import { sa, resolveShopId }                   from '../Utils/SellAuth.js';
import { runApi, renderOk }                    from '../Utils/ApiCommand.js';
import { guardSuperUser }                      from '../Utils/Permissions.js';
import { handleAutocomplete }                  from '../Utils/Autocomplete.js';

export const category = 'Checkout';

export const data = new SlashCommandBuilder()
  .setName('checkout')
  .setDescription('[Owner] SellAuth — create checkout sessions')

  .addSubcommand(s => s.setName('create').setDescription('Create a checkout session (Business plan)')
    .addStringOption(o => o.setName('cart').setDescription('JSON array of products').setRequired(true))
    .addStringOption(o => o.setName('email').setDescription('Customer email'))
    .addStringOption(o => o.setName('payment_method_id').setDescription('Pre-selected payment method ID').setAutocomplete(true))
    .addStringOption(o => o.setName('coupon').setDescription('Coupon code'))
    .addStringOption(o => o.setName('country_code').setDescription('Two-letter country code'))
    .addStringOption(o => o.setName('ip').setDescription('Customer IP'))
    .addStringOption(o => o.setName('discord_user_id').setDescription('Discord user ID'))
    .addStringOption(o => o.setName('affiliate').setDescription('Affiliate code (max 16 chars)'))
    .addBooleanOption(o => o.setName('newsletter').setDescription('Newsletter opt-in'))
    .addStringOption(o => o.setName('shop').setDescription('Shop ID').setAutocomplete(true)));

export async function execute(interaction) {
  const ctx = ctxFromInteraction(interaction);
  if (!await guardSuperUser(ctx)) return;
  const sid = resolveShopId(interaction.options.getString('shop'));

  let cart;
  try { cart = JSON.parse(interaction.options.getString('cart')); }
  catch { throw new Error('cart must be a valid JSON array.'); }

  const body = {
    cart,
    email:                interaction.options.getString('email')             ?? undefined,
    payment_method_id:    interaction.options.getString('payment_method_id') ?? undefined,
    coupon:               interaction.options.getString('coupon')            ?? undefined,
    country_code:         interaction.options.getString('country_code')      ?? undefined,
    ip:                   interaction.options.getString('ip')                ?? undefined,
    discord_user_id:      interaction.options.getString('discord_user_id')   ?? undefined,
    affiliate:            interaction.options.getString('affiliate')         ?? undefined,
    newsletter:           interaction.options.getBoolean('newsletter')       ?? undefined,
  };

  return runApi(ctx, () => sa.post(`/shops/${sid}/checkout`, body), {
    title: 'Checkout', render: (p) => renderOk(ctx, { title: 'Checkout session created', data: p }),
  });
}

// `payment_method_id` autocomplete maps to the `method_id` resource — wrap
// the focused option name before delegating to the generic handler.
export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  if (focused?.name === 'payment_method_id') {
    const wrapped = new Proxy(interaction, {
      get(target, prop) {
        if (prop === 'options') {
          return new Proxy(target.options, {
            get(o, p) {
              if (p === 'getFocused') return (full) => full ? { ...focused, name: 'method_id' } : focused.value;
              return o[p].bind ? o[p].bind(o) : o[p];
            },
          });
        }
        return target[prop].bind ? target[prop].bind(target) : target[prop];
      },
    });
    return handleAutocomplete(wrapped);
  }
  return handleAutocomplete(interaction);
}

export default { data, execute, autocomplete, category };
