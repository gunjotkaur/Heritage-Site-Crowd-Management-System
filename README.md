# Heritage Site Crowd Management System

A smart tourism platform that helps visitors discover heritage sites (monuments, forts, museums), book time slots, get QR tickets, and helps administrators and entry staff manage real-time crowd levels.

## User Roles

- **Visitor:** explore sites, book slots, get QR tickets, write reviews
- **Admin:** manage sites, tickets, slots, staff, analytics and reports
- **Staff:** scan QR tickets, verify bookings, record entry and exit

## Tech Stack

- Next.js (App Router), React, TypeScript
- Tailwind CSS, shadcn/ui
- PostgreSQL (Neon), Prisma ORM
- Auth.js
- Recharts, Cloudinary

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd heritage-crowd-system
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your own Neon connection strings.

```bash
cp .env.example .env
```

### 3. Set up the database

```bash
npx prisma migrate deploy
npx prisma generate
```

### 4. Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Useful Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Check code quality |
| `npx prisma studio` | View database in browser |

## Branch Strategy

- `main`: stable code only
- `gunjot-dev`, `sanskriti-dev`: personal working branches
- Merge into `main` through Pull Requests after each module

## Commit Message Style

`feat:` new feature, `fix:` bug fix, `chore:` setup, `docs:` documentation

## Team

- Gunjot
- Sanskriti