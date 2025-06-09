import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class ApiService {
  static const String baseUrl = AppConstants.baseUrl;
  late SharedPreferences _prefs;

  ApiService() {
    _initPrefs();
  }

  void _initPrefs() async {
    _prefs = await SharedPreferences.getInstance();
  }

  String? get _token => _prefs.getString(AppConstants.accessTokenKey);

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }

  // Authentication
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/token/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'username': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Login failed');
    }
  }

  // Generic GET request
  Future<dynamic> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to fetch data');
    }
  }

  // Generic POST request
  Future<dynamic> post(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
      body: jsonEncode(data),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create data');
    }
  }

  // Generic PUT request
  Future<dynamic> put(String endpoint, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update data');
    }
  }

  // Generic DELETE request
  Future<void> delete(String endpoint) async {
    final response = await http.delete(
      Uri.parse('$baseUrl$endpoint'),
      headers: _headers,
    );

    if (response.statusCode != 204 && response.statusCode != 200) {
      throw Exception('Failed to delete data');
    }
  }

  // Investments
  Future<List<dynamic>> getInvestments() => get('/investments/');
  Future<dynamic> createInvestment(Map<String, dynamic> data) => post('/investments/', data);
  Future<dynamic> updateInvestment(int id, Map<String, dynamic> data) => put('/investments/$id/', data);
  Future<void> deleteInvestment(int id) => delete('/investments/$id/');
  Future<dynamic> getStockPrice(String symbol) => get('/ltp/get_price/?symbol=$symbol');

  // Income
  Future<List<dynamic>> getIncomes() => get('/incomes/');
  Future<dynamic> createIncome(Map<String, dynamic> data) => post('/incomes/', data);
  Future<dynamic> updateIncome(int id, Map<String, dynamic> data) => put('/incomes/$id/', data);
  Future<void> deleteIncome(int id) => delete('/incomes/$id/');
  Future<dynamic> getIncomeSummary() => get('/incomes/summary/');

  // Expenses
  Future<List<dynamic>> getExpenses() => get('/expenses/');
  Future<dynamic> createExpense(Map<String, dynamic> data) => post('/expenses/', data);
  Future<dynamic> updateExpense(int id, Map<String, dynamic> data) => put('/expenses/$id/', data);
  Future<void> deleteExpense(int id) => delete('/expenses/$id/');
  Future<dynamic> getExpenseSummary() => get('/expenses/summary/');

  // Budgets
  Future<List<dynamic>> getBudgets() => get('/budgets/');
  Future<dynamic> createBudget(Map<String, dynamic> data) => post('/budgets/', data);
  Future<dynamic> updateBudget(int id, Map<String, dynamic> data) => put('/budgets/$id/', data);
  Future<void> deleteBudget(int id) => delete('/budgets/$id/');
  Future<dynamic> getCurrentMonthSummary() => get('/budgets/current_month_summary/');

  // Assets
  Future<List<dynamic>> getAssets() => get('/assets/');
  Future<dynamic> createAsset(Map<String, dynamic> data) => post('/assets/', data);
  Future<dynamic> updateAsset(int id, Map<String, dynamic> data) => put('/assets/$id/', data);
  Future<void> deleteAsset(int id) => delete('/assets/$id/');
  Future<dynamic> getAssetSummary() => get('/assets/summary/');

  // Liabilities
  Future<List<dynamic>> getLiabilities() => get('/liabilities/');
  Future<dynamic> createLiability(Map<String, dynamic> data) => post('/liabilities/', data);
  Future<dynamic> updateLiability(int id, Map<String, dynamic> data) => put('/liabilities/$id/', data);
  Future<void> deleteLiability(int id) => delete('/liabilities/$id/');
  Future<dynamic> getLiabilitySummary() => get('/liabilities/summary/');

  // Money Lent
  Future<List<dynamic>> getMoneyLent() => get('/money-lent/');
  Future<dynamic> createMoneyLent(Map<String, dynamic> data) => post('/money-lent/', data);
  Future<dynamic> updateMoneyLent(int id, Map<String, dynamic> data) => put('/money-lent/$id/', data);
  Future<void> deleteMoneyLent(int id) => delete('/money-lent/$id/');
  Future<dynamic> getMoneyLentSummary() => get('/money-lent/summary/');
  Future<dynamic> recordPayment(int id, double amount) => post('/money-lent/$id/record_payment/', {'payment_amount': amount});

  // Exchange Rates
  Future<dynamic> getCurrentRates() => get('/exchange-rates/current_rates/');
  Future<dynamic> updateExchangeRate(Map<String, dynamic> data) => post('/exchange-rates/update_rate/', data);
}