# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the GOAL football predictions mobile app built with Expo React Native.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (api-server)
- **Mobile**: Expo React Native (Expo Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **i18n**: i18next + react-i18next (FR/EN)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/        # Express API server
│   ├── goal/              # GOAL mobile app (Expo)
│   └── mockup-sandbox/    # UI prototyping
├── lib/                   # Shared libraries
└── scripts/               # Utility scripts
```

## GOAL App (`artifacts/goal`)

Football predictions mobile app with:
- **Auth**: Login / Register / Forgot Password via Supabase Auth
- **Home**: Matches list with date selector (scrollable, collapsible by week/month/year)
- **VIP**: Premium section (gold theme, locked for non-VIP users)
- **Dashboard**: Admin-only stats and management
- **Me**: Profile, theme (light/dark/auto), language, notifications, logout
- **Navigation**: Animated floating dock (hides on scroll, reappears on scroll up)

### Supabase Configuration
- URL: https://ucyrvqdxwgpwxjehwldh.supabase.co
- Credentials in: `artifacts/goal/.env`
- Tables: `profiles`, `teams`, `matches`, `predictions`

### Admin User
- Email: mr.fk.master@gmail.com
- Password: ferelONDONGO1631@
- Role: VIP + Admin (sees Dashboard tab)

### Key Files
- `utils/supabase.ts` - Supabase client
- `contexts/AuthContext.tsx` - Auth state
- `contexts/ThemeContext.tsx` - Theme (dark/light/auto)
- `i18n/index.ts` - Translations (FR/EN)
- `services/matchService.ts` - Data fetching
- `components/MatchCard.tsx` - Match display card
- `components/DateSelector.tsx` - Date picker bar
- `app/(tabs)/_layout.tsx` - Floating animated tab bar

## Running the App

```bash
pnpm --filter @workspace/goal run dev
```

Scan QR code with Expo Go on your phone to test.
