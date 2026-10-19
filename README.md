# WiseU 🎓
> Spend smart. Save more. Graduate richer.

WiseU is an AI-powered student expense tracker that uses Membrain's semantic memory graph to deliver personalized financial insights.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express + Prisma + PostgreSQL
- AI Memory: Membrain API (semantic vector memory graph)
- Deployment: Antigravity

## Features
- Smart expense tracking with category budgets
- AI-powered insights via Membrain semantic memory
- SMS auto-extract for bank transactions
- Financial health score + anomaly detection
- Spending forecast + daily spendable budget
- Interactive memory graph visualization

## Setup
### Backend
```bash
cd backend
npm install
cp .env.example .env  # fill in your values
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
