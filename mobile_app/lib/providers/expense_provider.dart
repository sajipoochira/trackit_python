import 'package:flutter/material.dart';
import '../models/expense.dart';
import '../services/api_service.dart';

class ExpenseProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Expense> _expenses = [];
  List<dynamic> _budgets = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _summary;
  Map<String, dynamic>? _budgetSummary;

  List<Expense> get expenses => _expenses;
  List<dynamic> get budgets => _budgets;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get summary => _summary;
  Map<String, dynamic>? get budgetSummary => _budgetSummary;

  double get totalExpenseInr => _expenses.fold(0, (sum, expense) => sum + expense.amountInInr);

  Future<void> loadExpenses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getExpenses();
      _expenses = data.map<Expense>((json) => Expense.fromJson(json)).toList();
      
      // Load summary
      _summary = await _apiService.getExpenseSummary();
    } catch (e) {
      _error = 'Failed to load expenses';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadBudgets() async {
    try {
      _budgets = await _apiService.getBudgets();
      _budgetSummary = await _apiService.getCurrentMonthSummary();
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load budgets';
      notifyListeners();
    }
  }

  Future<bool> createExpense(Expense expense) async {
    try {
      await _apiService.createExpense(expense.toJson());
      await loadExpenses();
      return true;
    } catch (e) {
      _error = 'Failed to create expense';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateExpense(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateExpense(id, data);
      await loadExpenses();
      return true;
    } catch (e) {
      _error = 'Failed to update expense';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteExpense(int id) async {
    try {
      await _apiService.deleteExpense(id);
      await loadExpenses();
      return true;
    } catch (e) {
      _error = 'Failed to delete expense';
      notifyListeners();
      return false;
    }
  }

  Future<bool> createBudget(Map<String, dynamic> budgetData) async {
    try {
      await _apiService.createBudget(budgetData);
      await loadBudgets();
      return true;
    } catch (e) {
      _error = 'Failed to create budget';
      notifyListeners();
      return false;
    }
  }

  List<Expense> getExpensesByCategory(String category) {
    return _expenses.where((expense) => expense.category == category).toList();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}