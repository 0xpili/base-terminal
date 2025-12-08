# Base Terminal

A terminal-style dashboard for exploring Base blockchain tokens, powered by the [Cambrian API](https://www.cambrian.org/).

## Features

- **Token Search** - Search by symbol or contract address
- **Price Overview** - Current price, 24h change, and price history chart
- **Top Holders** - View the largest token holders with percentage breakdown
- **DEX Pools** - Analytics for Aerodrome, Uniswap V3, PancakeSwap, SushiSwap, and Alien Base
- **CSV Export** - Export holder and pool data
- **Retro Terminal UI** - CRT-style aesthetic with Matrix green theme

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/0xpili/base-terminal.git
cd base-terminal

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Cambrian API key to .env.local
```

### Environment Variables

```
CAMBRIAN_API_KEY=your_api_key_here
```

Get your API key at [cambrian.org](https://www.cambrian.org/).

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
pnpm build
pnpm start
```

## License

ISC

## Author

[pili](https://0xpili.xyz/)
