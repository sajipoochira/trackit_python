class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://localhost:8000/api';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  
  // Currency Options
  static const List<Map<String, String>> currencies = [
    {'value': 'INR', 'label': 'Indian Rupee (₹)', 'symbol': '₹'},
    {'value': 'QAR', 'label': 'Qatari Riyal (ر.ق)', 'symbol': 'ر.ق'},
  ];
  
  // Investment Types
  static const List<String> investmentTypes = [
    'Stock',
    'Bond',
    'Mutual Fund',
    'ETF',
    'Cryptocurrency',
    'Real Estate',
    'Gold',
    'Business',
    'Other'
  ];
  
  // Asset Types
  static const List<Map<String, String>> assetTypes = [
    {'value': 'property', 'label': 'Real Estate'},
    {'value': 'vehicle', 'label': 'Vehicle'},
    {'value': 'jewelry', 'label': 'Jewelry'},
    {'value': 'electronics', 'label': 'Electronics'},
    {'value': 'furniture', 'label': 'Furniture'},
    {'value': 'art', 'label': 'Art & Collectibles'},
    {'value': 'equipment', 'label': 'Equipment'},
    {'value': 'bank_account', 'label': 'Bank Account'},
    {'value': 'other', 'label': 'Other'},
  ];
  
  // Liability Types
  static const List<Map<String, String>> liabilityTypes = [
    {'value': 'personal_loan', 'label': 'Personal Loan'},
    {'value': 'home_loan', 'label': 'Home Loan'},
    {'value': 'car_loan', 'label': 'Car Loan'},
    {'value': 'education_loan', 'label': 'Education Loan'},
    {'value': 'credit_card', 'label': 'Credit Card Debt'},
    {'value': 'business_loan', 'label': 'Business Loan'},
    {'value': 'money_borrowed', 'label': 'Money Borrowed'},
    {'value': 'mortgage', 'label': 'Mortgage'},
    {'value': 'other', 'label': 'Other'},
  ];
  
  // Income Categories
  static const List<Map<String, String>> incomeCategories = [
    {'value': 'salary', 'label': 'Salary'},
    {'value': 'freelance', 'label': 'Freelance'},
    {'value': 'business', 'label': 'Business'},
    {'value': 'investment', 'label': 'Investment Returns'},
    {'value': 'rental', 'label': 'Rental Income'},
    {'value': 'dividend', 'label': 'Dividend'},
    {'value': 'interest', 'label': 'Interest'},
    {'value': 'bonus', 'label': 'Bonus'},
    {'value': 'commission', 'label': 'Commission'},
    {'value': 'pension', 'label': 'Pension'},
    {'value': 'gift', 'label': 'Gift'},
    {'value': 'other', 'label': 'Other'},
  ];
  
  // Expense Categories
  static const List<Map<String, String>> expenseCategories = [
    {'value': 'food_and_groceries', 'label': 'Food and Groceries'},
    {'value': 'internet', 'label': 'Internet'},
    {'value': 'mobile', 'label': 'Mobile'},
    {'value': 'residency_renewal', 'label': 'Residency Renewal'},
    {'value': 'car_petrol', 'label': 'Car - Petrol'},
    {'value': 'medical', 'label': 'Medical'},
    {'value': 'car_insurance_maintenance', 'label': 'Car - Insurance+Maintenance'},
    {'value': 'tickets', 'label': 'Tickets'},
    {'value': 'school', 'label': 'School'},
    {'value': 'electronics_items', 'label': 'Electronics Items'},
    {'value': 'misc', 'label': 'Misc'},
    {'value': 'madrasa', 'label': 'Madrasa'},
    {'value': 'rent_we', 'label': 'Rent+WE'},
    {'value': 'clothes', 'label': 'Clothes'},
    {'value': 'transport', 'label': 'Transportation'},
    {'value': 'shopping', 'label': 'Shopping'},
    {'value': 'entertainment', 'label': 'Entertainment'},
    {'value': 'bills', 'label': 'Bills & Utilities'},
    {'value': 'healthcare', 'label': 'Healthcare'},
    {'value': 'education', 'label': 'Education'},
    {'value': 'travel', 'label': 'Travel'},
    {'value': 'investment', 'label': 'Investment'},
    {'value': 'insurance', 'label': 'Insurance'},
    {'value': 'rent', 'label': 'Rent'},
    {'value': 'groceries', 'label': 'Groceries'},
    {'value': 'fuel', 'label': 'Fuel'},
    {'value': 'other', 'label': 'Other'},
  ];
}