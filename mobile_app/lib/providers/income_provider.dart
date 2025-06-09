import 'package:flutter/material.dart';
import '../models/income.dart';
import '../services/api_service.dart';

class IncomeProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Income> _incomes = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _summary;

  List<Income> get incomes => _incomes;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get summary => _summary;

  double get totalIncomeInr => _incomes.fold(0, (sum, income) => sum + income.amountInInr);

  Future<void> loadIncomes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getIncomes();
      _incomes = data.map<Income>((json) => Income.fromJson(json)).toList();
      
      // Load summary
      _summary = await _apiService.getIncomeSummary();
    } catch (e) {
      _error = 'Failed to load incomes';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createIncome(Income income) async {
    try {
      await _apiService.createIncome(income.toJson());
      await loadIncomes();
      return true;
    } catch (e) {
      _error = 'Failed to create income';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateIncome(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateIncome(id, data);
      await loadIncomes();
      return true;
    } catch (e) {
      _error = 'Failed to update income';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteIncome(int id) async {
    try {
      await _apiService.deleteIncome(id);
      await loadIncomes();
      return true;
    } catch (e) {
      _error = 'Failed to delete income';
      notifyListeners();
      return false;
    }
  }

  List<Income> getIncomesByCategory(String category) {
    return _incomes.where((income) => income.category == category).toList();
  }

  List<Income> getRecurringIncomes() {
    return _incomes.where((income) => income.isRecurring).toList();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}