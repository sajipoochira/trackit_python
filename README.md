# TrackIt - Personal Finance Tracker

Full‑stack personal finance tracker with Django REST API and a React frontend. Includes holdings, income, expenses, liabilities, and live stock quotes for Indian markets.

## Highlights

- Investment tracking: stocks, funds, crypto, real estate, gold, business, more
- Live stock quotes: BSE/NSE via Indian API (stock.indianapi.in)
- Auto-refresh quotes: hourly, Mon–Fri, 08:00–14:00 (server time)
- On‑demand price refresh from the UI
- Current Stock Holdings view: Qty, Avg Cost, Total Cost, LTP, Current Value, and overall totals incl. Profit/Loss
- JWT auth; CORS enabled for local dev

## Tech Stack

- Backend: Django REST Framework
- Frontend: React (Vite) + Bootstrap 5 (folder: `frontend-react`)
- Database: SQLite by default (Supabase/PostgreSQL optional)
- Auth: JWT
- Quotes: Indian API (BSE/NSE) + server‑side cache

## Setup

### Backend

1) Create `backend/.env` (example):

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Optional: use Postgres via Supabase
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Indian API for quotes
INDIANAPI_BASE_URL=https://stock.indianapi.in
INDIANAPI_KEY=YOUR_LIVE_API_KEY
```

2) Install and run:

```bash
cd backend
pip install -r requirements.txt  # includes requests and APScheduler
python manage.py makemigrations finance
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend-react
npm install
npm run dev
```

Environment (optional): `frontend-react/.env`

```env
VITE_API_BASE=http://localhost:8000/api
```

### Access

- Frontend: http://localhost:5173
- API: http://localhost:8000/api
- Admin: http://localhost:8000/admin

### API Docs (optional)

If `drf-spectacular` is installed (already listed in `backend/requirements.txt`):

- OpenAPI schema: http://localhost:8000/api/schema/
- Swagger UI: http://localhost:8000/api/docs/

## Quotes: How It Works

- Endpoint: `GET /api/ltp/get_price/?symbol=EKC` fetches from Indian API and caches BSE/NSE in DB.
- Endpoint: `GET /api/ltp/latest/?symbol=EKC` returns last cached quote.
- Unified fields in both responses: `ltp`, `currency` (INR), `as_of`, `source` (in addition to `currentPrice`).
- Scheduler (APScheduler) refreshes distinct `Investment.symbol` hourly Mon–Fri between 08:00 and 14:00.
- Frontend holdings page includes a “Refresh Prices” button for on‑demand updates.

Response shape returned to the client (example):

```json
{
  "symbol": "EKC",
  "companyName": "Everest Kanto Cylinder",
  "currentPrice": { "BSE": "146.25", "NSE": "146.96" },
  "updatedAt": "2025-10-30T06:34:23Z"
}
```

## Current Stock Holdings

- Columns: Symbol, Name, Qty, Avg Cost (INR), Total Cost (INR), LTP (INR), Current Value (INR)
- Footer totals:
  - Total Cost (sum of cost)
  - Total Current Value (sum of qty × LTP)
  - Profit/Loss (Current Value − Total Cost)

## API Overview

- Auth
  - `POST /api/token/` (username, password)
  - `POST /api/token/refresh/`
- Core resources
  - `GET/POST /api/investments/`
  - `GET/PUT/DELETE /api/investments/{id}/`
  - `GET/POST /api/expenses/`, `/api/incomes/`, `/api/assets/`, `/api/liabilities/` …
- Quotes
  - `GET /api/ltp/get_price/?symbol=SYMBOL` - fetch + cache from upstream (includes `ltp`, `currency`, `as_of`, `source`)
  - `GET /api/ltp/latest/?symbol=SYMBOL` - read cached (includes unified fields)
- Reports
  - `GET /api/reports/net_worth/` - snapshot totals in INR
  - `GET /api/reports/monthly_expenses/?year=YYYY&month=MM` - expense breakdown in INR
  - `GET /api/reports/monthly_cashflow/?year=YYYY` - monthly income/expense totals and net in INR
  - `GET /api/reports/net_worth_timeline/?year=YYYY` - approximate end-of-month net worth based on baseline + monthly net flows
- Reports
  - `GET /api/reports/net_worth/` - snapshot totals in INR
  - `GET /api/reports/monthly_expenses/?year=YYYY&month=MM` - expense breakdown in INR
  - `GET /api/reports/monthly_cashflow/?year=YYYY` - monthly income/expense totals and net in INR

## Troubleshooting

- 401 from API calls
  - Ensure JWT tokens are present; login via `/api/token/`.
- Quotes not updating
  - Verify `INDIANAPI_KEY` in `backend/.env` and restart backend.
  - Use the “Refresh Prices” button; check server logs for upstream errors.
- Migrations missing
  - Run `python manage.py makemigrations finance && python manage.py migrate` (adds StockQuote model).

## Notes

- Symbols should match what Indian API expects in the `name`/`symbol` query.
- Scheduler runs in-process; for multi-worker deployments consider an external scheduler.

## Frontend variants

- React app in `frontend-react` is the primary UI going forward.
- The legacy `frontend` service in docker-compose has been removed; run the React app locally with Vite.
- The static `frontend` (HTML/JS) remains in the repo for legacy/testing and may be removed later.
