<div align="center">

<img src="https://img.shields.io/badge/SellAuth-AIO%20Bot-00ff77?style=for-the-badge&logo=discord&logoColor=white" alt="SellAuth AIO Bot"/>

# 🛒 SellAuth AIO — Discord Bot

**A fully-featured Discord bot to manage your [SellAuth](https://sellauth.com) shop directly from Discord.**  
Supports slash commands, prefix commands, pagination, autocomplete, and full API coverage.

[![Discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-00ff77?style=flat-square)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-lampuoghini-181717?style=flat-square&logo=github)](https://github.com/lampuoghini)

</div>

---

## ✨ Features

- 🛠️ **Full SellAuth API coverage** — Products, Invoices, Customers, Coupons, Payments, Tickets, and more
- ⚡ **Slash commands** with autocomplete for IDs (products, invoices, customers, etc.)
- 💬 **Prefix commands** (configurable prefix, default `;`)
- 📄 **Paginated list views** with interactive ◀ / ▶ buttons
- 🔒 **Owner/Developer permission system**
- ⏱️ **Per-user and per-staff cooldowns**
- 📊 **Logging** to Discord channels or webhooks
- 🔁 **Automatic retry** on rate limits and 5xx errors
- 🖼️ **Image upload** via Discord attachments or URL

---

## 📦 Command Categories

| Category | Command | Description |
|----------|---------|-------------|
| 🏪 Shops | `/shops` | List, create, update, delete shops & stats |
| 📦 Products | `/products` | Full product CRUD, stock, deliverables, bulk updates |
| 🧾 Invoices | `/invoices` | List, refund, cancel, archive, PDF, replace delivered |
| 👤 Customers | `/customers` | Manage customers, balances, affiliate codes |
| 🎟️ Coupons | `/coupons` | Create, update, delete coupons |
| 💳 Payment Methods | `/payments` | List, create, toggle, reorder payment methods |
| 🗂 Categories | `/categories` | Product category management |
| 🧱 Groups | `/groups` | Product group management |
| 📝 Blog Posts | `/blogs` | Blog post CRUD |
| 💬 Feedbacks | `/feedbacks` | Reply, dispute, filter feedbacks |
| 🎫 Tickets | `/tickets` | Create, close, reply to support tickets |
| 🚫 Blacklist | `/blacklist` | Block emails, IPs, Discord IDs, etc. |
| 🌐 Domains | `/domains` | Manage custom domains |
| 🧩 Custom Fields | `/customfields` | Product custom fields |
| 🖼 Images | `/images` | Upload (attachment or URL), delete, bulk delete |
| 🪙 Crypto | `/crypto` | Payout history, balances, send payouts |
| 🛒 Checkout | `/checkout` | Create checkout sessions (Business plan) |
| 📊 Analytics | `/analytics` | Revenue overview, graph, top products & customers |
| 📜 Activity | `/activity` | Activity log viewer |
| 🔔 Notifications | `/notifications` | View and configure notifications |
| 🔧 Raw API | `/sa` | Raw passthrough to any SellAuth endpoint |
| ✨ Help | `/help` | Interactive command list by category |

---

## 🚀 Getting Started

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

> 💡 You can find your SellAuth API key at: **Dashboard → Account → API → Create token**

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

## ⚙️ Configuration Reference

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

## 🗂 Project Structure

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

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ by [lampuoghini](https://github.com/lampuoghini)  
Powered by [SellAuth](https://sellauth.com) • Built with [discord.js](https://discord.js.org)

</div>