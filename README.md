# TrackIt - Personal Finance Tracker

A full-stack personal finance tracking application built with Django REST Framework and React, using Supabase as the database.

## Features

- **Investment Tracking**: Track stocks, bonds, mutual funds, ETFs, cryptocurrency, real estate, gold, business investments, and more
- **Real-time Stock Prices**: Automatic price updates for stocks using Kite Connect API
- **Bulk Upload**: CSV import functionality for adding multiple investments at once
- **Income & Expense Tracking**: (Coming soon)
- **Asset Management**: (Coming soon)

## Tech Stack

- **Backend**: Django REST Framework, PostgreSQL (via Supabase)
- **Frontend**: React, TypeScript, Bootstrap 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Stock API**: Kite Connect

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your project URL and API keys

### 2. Kite Connect Setup

1. Go to [Kite Connect](https://kite.trade/) and create a developer account
2. Create a new app to get your API key and secret
3. Note: You'll need to complete KYC and have a Zerodha account

### 3. Environment Variables

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

# Kite Connect API Configuration
API_KEY=your_kite_api_key
API_SECRET=your_kite_api_secret
```

**frontend/.env**:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
VITE_API_URL=http://localhost:8000
```

### 4. Getting Supabase Database URL

1. In your Supabase dashboard, go to Settings > Database
2. Scroll down to "Connection string" section
3. Copy the URI and replace `[YOUR-PASSWORD]` with your actual database password
4. Use this as your `DATABASE_URL` in the backend `.env` file

### 5. Getting Kite Connect API Credentials

1. Go to [Kite Connect](https://developers.kite.trade/)
2. Login with your Zerodha credentials
3. Create a new app
4. Copy the API Key and API Secret
5. Add them to your `backend/.env` file

**Important**: 
- You need a valid Zerodha trading account
- Complete KYC verification is required
- The API credentials are for live trading, use carefully

### 6. Running the Application

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

### 7. Create Admin User

```bash
cd backend
python manage.py createsuperuser
```

### 8. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin

## Using Kite Connect Authentication

1. **Login to the app** with your admin credentials
2. **Go to Investments page**
3. **Click "Refresh Prices"** - this will prompt for Kite authentication
4. **Click "Open Kite Login"** - this opens Kite in a new tab
5. **Login with your Zerodha credentials**
6. **Copy the request token** from the redirect URL
7. **Paste it in the modal** and click "Complete Authentication"
8. **Your access token is now stored** and you can refresh stock prices

## API Endpoints

- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh token
- `GET/POST /api/investments/` - List/Create investments
- `GET/PUT/DELETE /api/investments/{id}/` - Retrieve/Update/Delete investment
- `GET /api/ltp/get_ltp/?symbol=SYMBOL&access_token=TOKEN` - Get live stock price
- `GET /api/kite/login-url/` - Get Kite login URL
- `POST /api/kite/callback/` - Handle Kite authentication callback

## CSV Upload Format

For bulk investment upload, use this CSV format:

```csv
name,symbol,type,qty,purchase_value,current_value
Apple Stock,AAPL,Stock,10,150.00,175.50
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

### Kite API Issues

1. **"Kite API credentials not configured"**:
   - Ensure `API_KEY` and `API_SECRET` are set in `backend/.env`
   - Restart the Django server after adding credentials

2. **"Invalid API credentials"**:
   - Verify your API key and secret from Kite Connect dashboard
   - Ensure your Zerodha account is active and KYC is complete

3. **"Access token expired"**:
   - Kite access tokens expire daily
   - Re-authenticate through the app to get a new token

### Database Issues

1. **Connection errors**:
   - Verify your Supabase DATABASE_URL is correct
   - Check if your Supabase project is active

2. **Migration errors**:
   - Run `python manage.py makemigrations` and `python manage.py migrate`
   - Ensure database permissions are correct

## Notes

- Stock symbols are optional but required for automatic price updates
- The Kite Connect API integration requires valid API credentials and active Zerodha account
- All monetary values are in INR (Indian Rupees)
- The application uses JWT authentication for API access
- Kite access tokens expire daily and need re-authentication