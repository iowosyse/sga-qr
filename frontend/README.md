# Frontend - SGA-QR

React + TypeScript + Vite + Tailwind CSS

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Server runs at `http://localhost:5173` with proxy to backend at `http://localhost:8000`.

## Build

```bash
npm run build
```

## Design Tokens

All colors, typography, spacing, animations, and shadows are configured in `tailwind.config.ts` based on design tokens extracted from the Figma mockup.

### Key Colors

- **Charcoal** (`#2C2C2A`) — Primary text, active states
- **Beige** (`#F5F4EF`) — App background
- **Success** (`#22C55E`) — Positive states, QR scanning
- **Warning** (`#F97316`) — Manual entries, alerts
- **Error** (`#DC2626`) — Critical states

### Typography

Font stack: `Inter` + system fonts

Sizes: 9px to 28px (see `tailwind.config.ts` for full scale)

Weights: 400, 500, 600, 700, 800

### Animations

- **Pulse**: 1.4s ease-in-out (status indicators)
- **Scanline**: 2.6s ease-in-out (QR scanner)
- **GPS Rings**: 2s ease-in-out staggered (geofencing)
- **Transitions**: 220ms ease-in-out (page navigation)

See `tailwind.config.ts` for keyframes and animation definitions.

## Project Structure

```
src/
├── components/         # React components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── lib/
│   ├── api.ts        # API client
│   └── utils.ts      # Utility functions
├── types/            # TypeScript types
├── store/            # State management (Zustand)
├── index.css         # Global styles
└── main.tsx          # Entry point
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Next Steps

1. Create components in `src/components/`
2. Create pages in `src/pages/`
3. Implement store in `src/store/` using Zustand
4. Connect to backend API endpoints
