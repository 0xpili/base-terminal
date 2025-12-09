# Base Terminal

A terminal-style dashboard for exploring Base blockchain tokens, powered by the [Cambrian API](https://www.cambrian.org/).

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## Features

- **Token Search** - Search by symbol or contract address
- **Price Overview** - Current price, 24h change, high/low, and price history chart
- **Top Holders** - View the largest token holders with percentage breakdown
- **DEX Pools** - Analytics for Aerodrome, Uniswap V3, PancakeSwap, SushiSwap, and Alien Base
- **CSV Export** - Export holder and pool data for analysis
- **Retro Terminal UI** - CRT-style aesthetic with Matrix green theme

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Cambrian API** - Base blockchain data

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Cambrian API key ([Get one here](https://www.cambrian.org/dashboard))

### Installation

```bash
# Clone the repository
git clone https://github.com/0xpili/base-terminal.git
cd base-terminal/base-terminal-dashboard

# Install dependencies
pnpm install

# Set up environment variables
cp .env.local.example .env.local
```

Edit `.env.local` and add your Cambrian API key:

```env
CAMBRIAN_API_KEY=your_api_key_here
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
base-terminal-dashboard/
├── app/                    # Next.js App Router
│   ├── api/cambrian/       # API proxy route
│   ├── globals.css         # Terminal theme styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main dashboard
├── components/             # React components
│   ├── AerodromePoolsCard.tsx
│   ├── ErrorMessage.tsx
│   ├── LoadingSpinner.tsx
│   ├── OtherDEXPoolsCard.tsx
│   ├── PriceOverviewCard.tsx
│   ├── TokenSearch.tsx
│   └── TopHoldersCard.tsx
├── lib/                    # Utilities and API client
│   ├── cambrian-api.ts     # Cambrian API client
│   ├── csv-utils.ts        # CSV export utilities
│   └── utils.ts            # Helper functions
├── types/                  # TypeScript definitions
│   └── cambrian.ts         # API response types
└── tests/                  # Test suites
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CAMBRIAN_API_KEY` | Yes | Your Cambrian API key |
| `CAMBRIAN_API_URL` | No | Custom API URL (defaults to production) |

## Available Scripts

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test         # Run Jest tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Generate coverage report
```

## API Architecture

The dashboard uses a proxy pattern to handle API requests securely:

```
Client → /api/cambrian (Next.js API Route) → Cambrian API
```

This approach:
- Keeps API keys secure (server-side only)
- Handles CORS automatically
- Enables response caching

## Debugging

Enable debug logging in the browser console:

```javascript
window.__CAMBRIAN_DEBUG__ = true
```

Or set `NODE_ENV=development` for server-side logging.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Cambrian](https://cambrian.org) - DeFi data API
- [Base](https://base.org) - L2 blockchain
- [Vercel](https://vercel.com) - Next.js and hosting

## Links

- [Live Demo](https://base-terminal.vercel.app) (if deployed)
- [Cambrian API Docs](https://docs.cambrian.org)
- [Report Issues](https://github.com/0xpili/base-terminal/issues)

---

Made by [pili](https://0xpili.xyz/)
