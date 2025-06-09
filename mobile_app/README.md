# TrackIt Mobile App

A comprehensive Flutter mobile application for personal finance tracking that parallels the React web frontend.

## Features

### 📱 **Complete Mobile Experience**
- **Native Mobile UI**: Optimized for mobile devices with touch-friendly interfaces
- **Bottom Navigation**: Easy access to all major sections
- **Drawer Navigation**: Additional features accessible via side drawer
- **Pull-to-Refresh**: Refresh data with simple pull gesture
- **Responsive Design**: Adapts to different screen sizes

### 💰 **Financial Management**
- **Dashboard**: Overview of financial health with charts and summaries
- **Investments**: Track stocks, bonds, mutual funds, ETFs, crypto, real estate, gold, business investments
- **Income Tracking**: Record and categorize income sources with recurring income support
- **Expense Management**: Track expenses with budget monitoring and alerts
- **Asset Management**: Manage physical assets including bank accounts
- **Liability Tracking**: Monitor loans, debts, and money lent to others

### 📊 **Data Visualization**
- **Portfolio Charts**: Pie charts showing investment distribution
- **Summary Cards**: Quick overview of key financial metrics
- **Progress Indicators**: Visual representation of budget utilization
- **Trend Analysis**: Track financial progress over time

### 🔄 **Real-time Features**
- **Stock Price Updates**: Automatic refresh of Indian stock prices via NSE
- **Currency Conversion**: Multi-currency support with exchange rate management
- **Live Calculations**: Real-time gain/loss calculations
- **Budget Alerts**: Notifications when approaching budget limits

## Technical Architecture

### 🏗️ **State Management**
- **Provider Pattern**: Clean separation of business logic and UI
- **Reactive Updates**: Automatic UI updates when data changes
- **Error Handling**: Comprehensive error states and retry mechanisms

### 🌐 **API Integration**
- **RESTful API**: Full integration with Django backend
- **Authentication**: JWT token-based authentication
- **Offline Support**: Local storage for critical data
- **Error Recovery**: Automatic retry and fallback mechanisms

### 🎨 **UI/UX Design**
- **Material Design 3**: Modern, consistent design language
- **Dark/Light Theme**: Automatic theme switching based on system preference
- **Accessibility**: Screen reader support and proper contrast ratios
- **Animations**: Smooth transitions and micro-interactions

## Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── models/                   # Data models
│   │   ├── investment.dart
│   │   ├── income.dart
│   │   ├── expense.dart
│   │   ├── asset.dart
│   │   ├── liability.dart
│   │   └── money_lent.dart
│   ├── providers/                # State management
│   │   ├── auth_provider.dart
│   │   ├── investment_provider.dart
│   │   ├── income_provider.dart
│   │   ├── expense_provider.dart
│   │   ├── asset_provider.dart
│   │   ├── liability_provider.dart
│   │   └── dashboard_provider.dart
│   ├── screens/                  # UI screens
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── investments/
│   │   ├── income/
│   │   ├── expenses/
│   │   ├── assets/
│   │   ├── liabilities/
│   │   └── shared/
│   ├── widgets/                  # Reusable UI components
│   │   ├── dashboard/
│   │   ├── investments/
│   │   └── shared/
│   ├── services/                 # API and business logic
│   │   └── api_service.dart
│   └── utils/                    # Utilities and constants
│       ├── constants.dart
│       └── theme.dart
└── pubspec.yaml                  # Dependencies and configuration
```

## Key Features Implementation

### 🔐 **Authentication**
- Secure login with JWT tokens
- Automatic token refresh
- Biometric authentication support (planned)
- Session management

### 📈 **Investment Tracking**
- **Portfolio Management**: Track multiple investment types
- **Real-time Prices**: NSE stock price integration
- **Performance Analytics**: Gain/loss calculations with percentages
- **Bulk Import**: CSV import functionality (planned)
- **Consolidated View**: Group investments by type

### 💳 **Expense & Budget Management**
- **Smart Categorization**: Predefined expense categories
- **Budget Monitoring**: Real-time budget utilization tracking
- **Alerts System**: Notifications for budget overruns
- **Monthly Summaries**: Comprehensive spending analysis

### 🏦 **Asset & Liability Management**
- **Bank Account Integration**: Track multiple bank accounts
- **Loan Monitoring**: Track various types of loans and debts
- **Money Lent Tracking**: Monitor money lent to others with payment tracking
- **Net Worth Calculation**: Automatic calculation of total net worth

### 📊 **Dashboard & Analytics**
- **Financial Overview**: Complete financial health snapshot
- **Interactive Charts**: Portfolio distribution and trend analysis
- **Recent Transactions**: Quick view of latest financial activities
- **Budget Alerts**: Visual indicators for budget status

## Getting Started

### Prerequisites
- Flutter SDK (>=3.10.0)
- Dart SDK (>=3.0.0)
- Android Studio / VS Code
- Android device or emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile_app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Configure API endpoint**
   Update `lib/utils/constants.dart`:
   ```dart
   static const String baseUrl = 'http://your-backend-url:8000/api';
   ```

4. **Run the app**
   ```bash
   flutter run
   ```

### Backend Setup
Ensure the Django backend is running and accessible. The mobile app connects to the same API endpoints as the web frontend.

## API Integration

The mobile app integrates with all backend endpoints:

- **Authentication**: `/api/token/`, `/api/token/refresh/`
- **Investments**: `/api/investments/`
- **Income**: `/api/incomes/`
- **Expenses**: `/api/expenses/`
- **Budgets**: `/api/budgets/`
- **Assets**: `/api/assets/`
- **Liabilities**: `/api/liabilities/`
- **Money Lent**: `/api/money-lent/`
- **Exchange Rates**: `/api/exchange-rates/`
- **Stock Prices**: `/api/ltp/get_price/`

## Features Parity with Web App

The mobile app provides complete feature parity with the React web frontend:

✅ **Dashboard with financial overview**
✅ **Investment tracking with real-time prices**
✅ **Income and expense management**
✅ **Budget creation and monitoring**
✅ **Asset management including bank accounts**
✅ **Liability tracking**
✅ **Money lent management**
✅ **Multi-currency support**
✅ **Exchange rate management**
✅ **Data visualization with charts**
✅ **Responsive design**
✅ **Error handling and offline support**

## Future Enhancements

- **Biometric Authentication**: Fingerprint/Face ID login
- **Push Notifications**: Budget alerts and payment reminders
- **Offline Mode**: Full offline functionality with sync
- **Export Features**: PDF reports and data export
- **Advanced Analytics**: Detailed financial insights and trends
- **Goal Setting**: Financial goal tracking and progress monitoring
- **Receipt Scanning**: OCR for expense receipt processing
- **Bank Integration**: Direct bank account synchronization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.