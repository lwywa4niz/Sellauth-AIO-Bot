<div align="center">

<img src="https://img.shields.io/badge/SellAuth-AIO%20Bot-00ff77?style=for-the-badge&logo=discord&logoColor=white" alt="SellAuth AIO Bot"/>

# <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6d2.svg" width="32" align="center"/> SellAuth AIO — Discord Bot

**A fully-featured Discord bot to manage your [SellAuth](https://sellauth.com) shop directly from Discord.**  
Supports slash commands, prefix commands, pagination, autocomplete, and full API coverage.

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-00ff77?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-lampuoghini-181717?style=flat-square&logo=github)](https://github.com/lampuoghini)

</div>

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2728.svg" width="22" align="center"/> Features

- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6e0.svg" width="16"/> **Full SellAuth API coverage** — Products, Invoices, Customers, Coupons, Payments, Tickets, and more
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/26a1.svg" width="16"/> **Slash commands** with autocomplete for IDs (products, invoices, customers, etc.)
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ac.svg" width="16"/> **Prefix commands** (configurable prefix, default `;`)
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4c4.svg" width="16"/> **Paginated list views** with interactive ◀ / ▶ buttons
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f512.svg" width="16"/> **Owner/Developer permission system**
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/23f1.svg" width="16"/> **Per-user and per-staff cooldowns**
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg" width="16"/> **Logging** to Discord channels or webhooks
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f501.svg" width="16"/> **Automatic retry** on rate limits and 5xx errors
- <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5bc.svg" width="16"/> **Image upload** via Discord attachments or URL

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4e6.svg" width="22" align="center"/> Command Categories

| Category | Command | Description |
|----------|---------|-------------|
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ea.svg" width="16"/> Shops | `/shops` | List, create, update, delete shops & stats |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4e6.svg" width="16"/> Products | `/products` | Full product CRUD, stock, deliverables, bulk updates |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9fe.svg" width="16"/> Invoices | `/invoices` | List, refund, cancel, archive, PDF, replace delivered |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f464.svg" width="16"/> Customers | `/customers` | Manage customers, balances, affiliate codes |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f39f.svg" width="16"/> Coupons | `/coupons` | Create, update, delete coupons |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4b3.svg" width="16"/> Payment Methods | `/payments` | List, create, toggle, reorder payment methods |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5c2.svg" width="16"/> Categories | `/categories` | Product category management |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9f1.svg" width="16"/> Groups | `/groups` | Product group management |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4dd.svg" width="16"/> Blog Posts | `/blogs` | Blog post CRUD |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ac.svg" width="16"/> Feedbacks | `/feedbacks` | Reply, dispute, filter feedbacks |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f3ab.svg" width="16"/> Tickets | `/tickets` | Create, close, reply to support tickets |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6ab.svg" width="16"/> Blacklist | `/blacklist` | Block emails, IPs, Discord IDs, etc. |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f310.svg" width="16"/> Domains | `/domains` | Manage custom domains |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f9e9.svg" width="16"/> Custom Fields | `/customfields` | Product custom fields |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5bc.svg" width="16"/> Images | `/images` | Upload (attachment or URL), delete, bulk delete |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1fa99.svg" width="16"/> Crypto | `/crypto` | Payout history, balances, send payouts |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f6d2.svg" width="16"/> Checkout | `/checkout` | Create checkout sessions (Business plan) |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ca.svg" width="16"/> Analytics | `/analytics` | Revenue overview, graph, top products & customers |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4dc.svg" width="16"/> Activity | `/activity` | Activity log viewer |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f514.svg" width="16"/> Notifications | `/notifications` | View and configure notifications |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f527.svg" width="16"/> Raw API | `/sa` | Raw passthrough to any SellAuth endpoint |
| <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2728.svg" width="16"/> Help | `/help` | Interactive command list by category |

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f680.svg" width="22" align="center"/> Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) **v18 or higher**
- A [Discord Bot](https://discord.com/developers/applications) token
- A [SellAuth](https://sellauth.com) API key

---

### 1. Clone the repository

```bash
git clone https://github.com/lampuoghini/sellauth-aio-bot.git
cd sellauth-aio-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the bot

Copy the example config and fill in your values:

```bash
cp Config.example.yaml Config.yaml
```

Then open `Config.yaml` and set:

```yaml
Discord:
  BotToken: "YOUR_DISCORD_BOT_TOKEN"   # From discord.com/developers
  ClientID: "YOUR_CLIENT_ID"           # From discord.com/developers
  BotPrefix: ";"                       # Prefix for prefix commands

  Users:
    Owners: ["YOUR_DISCORD_USER_ID"]   # IDs of bot owners

SellAuth:
  ApiKey:        "YOUR_SELLAUTH_API_KEY"   # From dash.sellauth.com/api
  DefaultShopId: "YOUR_DEFAULT_SHOP_ID"   # Your main shop ID
```

> <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4a1.svg" width="15"/> You can find your SellAuth API key at: **Dashboard → Account → API → Create token**

---

### 4. Start the bot

```bash
node main.js
```

The bot will:
1. Load all events and commands
2. Register slash commands globally with Discord
3. Log in and set its presence

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2699.svg" width="22" align="center"/> Configuration Reference

`Config.yaml` supports the following sections:

### Discord

| Key | Description |
|-----|-------------|
| `BotToken` | Your Discord bot token |
| `ClientID` | Your Discord application client ID |
| `BotPrefix` | Prefix for prefix-style commands (default: `;`) |
| `Users.Owners` | Array of Discord user IDs with full access |
| `Users.Developers` | Array of developer user IDs (same access as owners) |
| `BotStatus.Status` | Bot status: `ONLINE` / `IDLE` / `DND` / `INVISIBLE` |
| `BotActivity.Type` | Activity type: `PLAYING` / `WATCHING` / `LISTENING` / `STREAMING` |
| `BotActivity.Text` | Activity text shown in Discord |

### CommandsSettings

| Key | Description |
|-----|-------------|
| `EnableSlash` | Enable or disable slash commands |
| `EnablePrefix` | Enable or disable prefix commands |
| `Cooldown.PerUser` | Cooldown in seconds for regular users |
| `Cooldown.PerStaff` | Cooldown in seconds for staff roles |
| `Cooldown.Ignore.Guild` | Guild IDs exempt from cooldown |
| `Cooldown.Ignore.Users` | User IDs exempt from cooldown |

### SellAuth

| Key | Description |
|-----|-------------|
| `ApiKey` | Your SellAuth API key |
| `DefaultShopId` | Default shop ID used when `shop` option is omitted |
| `BaseURL` | API base URL (default: `https://api.sellauth.com/v1`) |
| `Timeout` | Request timeout in ms (default: `15000`) |
| `PerPage` | Default items per page for list commands (default: `15`) |

### LogSettings

Logs can be sent to a Discord channel or webhook. Enable each target independently:

```yaml
LogSettings:
  Commands:
    Enable:    true
    Type:      "Webhook"   # or "Channel"
    Webhook:   "https://discord.com/api/webhooks/..."
```

Available log targets: `BotLogs`, `Commands`, `Api`, `DebugLog`

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f5c2.svg" width="22" align="center"/> Project Structure

```
.
├── main.js                   # Entry point — loads events, commands, registers slash
├── bot.js                    # Discord client + config loader
├── Config.yaml               # Your config (not committed)
├── Config.example.yaml       # Example config template
│
├── Commands/                 # Slash command modules
│   ├── Activity.js
│   ├── Analytics.js
│   ├── Blacklist.js
│   ├── Blogs.js
│   ├── Categories.js
│   ├── Checkout.js
│   ├── Coupons.js
│   ├── Crypto.js
│   ├── CustomFields.js
│   ├── Customers.js
│   ├── Domains.js
│   ├── Feedbacks.js
│   ├── Groups.js
│   ├── Help.js
│   ├── Images.js
│   ├── Invoices.js
│   ├── Notifications.js
│   ├── Payments.js
│   ├── Products.js
│   ├── Raw.js
│   ├── Shops.js
│   └── Tickets.js
│
├── Events/                   # Discord.js event handlers
│   ├── InteractionCreate.js
│   ├── MessageCreate.js
│   └── Ready.js
│
├── Interactions/             # Button & select menu handlers
│   ├── HelpSelect.js
│   └── Paginate.js
│
└── Utils/                    # Shared utilities
    ├── ApiCommand.js         # runApi, runListApi, pagination
    ├── Autocomplete.js       # Generic ID autocomplete
    ├── Commands.js           # ctx helpers (slash + prefix)
    ├── Embeds.js             # Embed builders & helpers
    ├── Logger.js             # Console + webhook logging
    ├── Permissions.js        # Owner/developer guards
    ├── SellAuth.js           # SellAuth API client wrapper
    └── Time.js               # Cooldown management
```

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f91d.svg" width="22" align="center"/> Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4c4.svg" width="22" align="center"/> License

This project is licensed under the [MIT License](LICENSE).

---

## <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f496.svg" width="22" align="center"/> Donate

<div align="center">

If this project helped you, consider supporting its development — every bit is appreciated! <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f64f.svg" width="16"/>

<table>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/USDT-Polygon-26A17B?style=for-the-badge&logo=tether&logoColor=white" alt="USDT Polygon"/>
    </td>
    <td><code>0xfCc8d58C8577B3aDA2fd27b9a368F3d6DEC947A5</code></td>
  </tr>
  <tr>
    <td align="center">
      <img src="https://img.shields.io/badge/Litecoin-LTC-345D9D?style=for-the-badge&logo=litecoin&logoColor=white" alt="Litecoin"/>
    </td>
    <td><code>LcggSz6zqNzPejreVmG3y6LpPzCCkfnpf2</code></td>
  </tr>
</table>

</div>

---

<div align="center">

### <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4ec.svg" width="20" align="center"/> Contact

[![Discord](https://img.shields.io/badge/Discord-2rht-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/users/961994878546485268)
[![Telegram](https://img.shields.io/badge/Telegram-@swllette-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/swllette)
[![Store](https://img.shields.io/badge/Store-store.waniboostz.cc-7076CC?style=for-the-badge&logo=shopify&logoColor=white)](https://store.waniboostz.cc)

<br>

Made with <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2764.svg" width="15"/> by [lampuoghini](https://github.com/lampuoghini)  
Powered by [SellAuth](https://sellauth.com) • Built with [discord.js](https://discord.js.org)

**Thank you for your support! <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/2b50.svg" width="15"/> Star the repo if you like it!**

</div>
