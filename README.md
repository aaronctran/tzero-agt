# tZERO Web App - Full-Stack Engineering Assignment

A digital securities trading platform built with Next.js 14, React 18, Material-UI 5, and SQLite.

**See [ASSIGNMENT.md](./ASSIGNMENT.md) for the take-home assignment instructions.**

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 14** (App Router) - Full-stack React framework
- **React 18** + **TypeScript** - UI with type safety
- **Material-UI 5** (Emotion) - Component library
- **SQLite** via `better-sqlite3` - In-house database (`data/tzero.db`)
- **Token-based auth** - Cookie + localStorage (pre-built)

## Project Structure

```
app/
  api/              # Backend API routes
    auth/           # Authentication endpoints
    trading/        # Trading/marketplace API (orders, summary)
    investments/    # Investment management
    banking/        # Banking/deposit endpoints
    payment-methods/# Payment method management
  auth/             # Auth pages (sign in, sign up)
  account/          # Account pages (portfolio, banking, setup)
  investing/        # Marketplace pages
    secondary-trading/  # Secondary marketplace (assignment focus)
  profile/          # User profile page

components/         # React components by feature
  investments/      # Trading cards, filters, section headers
  portfolio/        # Portfolio, banking, payment UI
  profile/          # Account information display
  theme/            # MUI theme (dark mode, #00FF88 primary)

lib/                # Server-side utilities
  db.ts             # SQLite schema & connection
  api.ts            # Axios HTTP client (auth-injected)
  *Store.ts         # Data access modules (user, trading, payment, etc.)

contexts/           # React context providers
  AuthContext.tsx    # Auth state (useAuth hook)

data/               # SQLite DB file + JSON seed data
  secondaryTradingAssets.json  # Asset catalog for secondary marketplace
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

## Theme

- **Background:** Black (`#000000`)
- **Primary:** tZERO Green (`#00FF88`)
- **Text:** White (`#ffffff`) / Gray (`#cccccc`)
