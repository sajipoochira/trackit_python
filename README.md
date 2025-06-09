# TrackIt - Personal Finance Tracker

A full-stack personal finance tracking application built with Django REST Framework and React, using Supabase as the database.

## Features

- **Investment Tracking**: Track stocks, bonds, mutual funds, ETFs, cryptocurrency, real estate, gold, business investments, and more
- **Real-time Stock Prices**: Automatic price updates for Indian stocks using NSEtools
- **Bulk Upload**: CSV import functionality for adding multiple investments at once
- **Income & Expense Tracking**: (Coming soon)
- **Asset Management**: (Coming soon)

## Tech Stack

- **Backend**: Django REST Framework, PostgreSQL (via Supabase)
- **Frontend**: React, TypeScript, Bootstrap 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Stock API**: NSEtools (for Indian stock market data)

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your project URL and API keys

### 2. Environment Variables

Create the following environment files:

**backend/.env**:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (get this from Supabase Settings > Database)
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres

# Django Configuration
DJANGO_SECRET_KEY=your-secret-key-for-development
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**frontend/.env**:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_URL=http://localhost:8000
```

### 3. Getting Supabase Database URL

1. In your Supabase dashboard, go to Settings > Database
2. Scroll down to "Connection string" section
3. Copy the URI and replace `[YOUR-PASSWORD]` with your actual database password
4. Use this as your `DATABASE_URL` in the backend `.env` file

### 4. Running the Application

#### Using Docker (Recommended)
```bash
docker-compose up --build
```

#### Manual Setup
```bash
# Backend
cd backend
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Create admin user
python manage.py runserver

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### 5. Create Admin User

```bash
cd backend
python manage.py createsuperuser
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

## Stock Price Updates

The application uses NSEtools to fetch real-time stock prices from the Indian stock market (NSE). This requires no authentication and works out of the box.

### Supported Stock Symbols

Use NSE stock symbols for Indian stocks:
- **Reliance**: RELIANCE
- **TCS**: TCS
- **Infosys**: INFY
- **HDFC Bank**: HDFCBANK
- **ITC**: ITC
- **Bharti Airtel**: BHARTIARTL

### How to Use:

1. **Add stocks with NSE symbols** when creating investments
2. **Click "Refresh Prices"** to update all stock prices automatically
3. **The system will fetch current prices** and update your investment values

## API Endpoints

- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh token
- `GET/POST /api/investments/` - List/Create investments
- `GET/PUT/DELETE /api/investments/{id}/` - Retrieve/Update/Delete investment
- `GET /api/ltp/get_price/?symbol=SYMBOL` - Get live stock price

## CSV Upload Format

For bulk investment upload, use this CSV format:

```csv
name,symbol,type,qty,purchase_value,current_value
Reliance Stock,RELIANCE,Stock,10,2500.00,2750.50
Gold Investment,,Gold,5,1800.00,1950.00
Tech Startup,,Business,1,10000.00,12500.00
```

## Investment Types Supported

- Stock
- Bond
- Mutual Fund
- ETF
- Cryptocurrency
- Real Estate
- Gold
- Business
- Other

## Troubleshooting

### Stock Price Issues

1. **"Stock data not found for symbol"**:
   - Ensure you're using correct NSE symbols
   - Check if the stock is actively traded on NSE
   - Verify the symbol spelling

2. **"Last price not available"**:
   - The stock might be suspended or not trading
   - Try during market hours (9:15 AM - 3:30 PM IST)

3. **Network errors**:
   - Check your internet connection
   - NSE servers might be temporarily unavailable

### Database Issues

1. **Connection errors**:
   - Verify your Supabase DATABASE_URL is correct
   - Check if your Supabase project is active

2. **Migration errors**:
   - Run `python manage.py makemigrations` and `python manage.py migrate`
   - Ensure database permissions are correct

## Notes

- Stock symbols should be NSE symbols for Indian stocks
- Stock price updates work during market hours for best results
- All monetary values are in INR (Indian Rupees)
- The application uses JWT authentication for API access
- NSEtools provides free access to Indian stock market data