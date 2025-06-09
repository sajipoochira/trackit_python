import 'package:flutter/material.dart';
import '../models/liability.dart';
import '../models/money_lent.dart';
import '../services/api_service.dart';

class LiabilityProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Liability> _liabilities = [];
  List<MoneyLent> _moneyLentRecords = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _liabilitySummary;
  Map<String, dynamic>? _moneyLentSummary;

  List<Liability> get liabilities => _liabilities;
  List<MoneyLent> get moneyLentRecords => _moneyLentRecords;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get liabilitySummary => _liabilitySummary;
  Map<String, dynamic>? get moneyLentSummary => _moneyLentSummary;

  double get totalDebtInr => _liabilities.fold(0, (sum, liability) => sum + liability.currentBalanceInInr);
  double get totalMonthlyPaymentInr => _liabilities.fold(0, (sum, liability) => sum + liability.monthlyPaymentInInr);
  double get totalMoneyLentInr => _moneyLentRecords.fold(0, (sum, record) => sum + record.amountLentInInr);
  double get totalOutstandingInr => _moneyLentRecords.fold(0, (sum, record) => sum + record.outstandingAmountInInr);

  Future<void> loadLiabilities() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getLiabilities();
      _liabilities = data.map<Liability>((json) => Liability.fromJson(json)).toList();
      
      // Load summary
      _liabilitySummary = await _apiService.getLiabilitySummary();
    } catch (e) {
      _error = 'Failed to load liabilities';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadMoneyLent() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getMoneyLent();
      _moneyLentRecords = data.map<MoneyLent>((json) => MoneyLent.fromJson(json)).toList();
      
      // Load summary
      _moneyLentSummary = await _apiService.getMoneyLentSummary();
    } catch (e) {
      _error = 'Failed to load money lent records';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadAll() async {
    await Future.wait([
      loadLiabilities(),
      loadMoneyLent(),
    ]);
  }

  Future<bool> createLiability(Liability liability) async {
    try {
      await _apiService.createLiability(liability.toJson());
      await loadLiabilities();
      return true;
    } catch (e) {
      _error = 'Failed to create liability';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateLiability(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateLiability(id, data);
      await loadLiabilities();
      return true;
    } catch (e) {
      _error = 'Failed to update liability';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteLiability(int id) async {
    try {
      await _apiService.deleteLiability(id);
      await loadLiabilities();
      return true;
    } catch (e) {
      _error = 'Failed to delete liability';
      notifyListeners();
      return false;
    }
  }

  Future<bool> createMoneyLent(MoneyLent moneyLent) async {
    try {
      await _apiService.createMoneyLent(moneyLent.toJson());
      await loadMoneyLent();
      return true;
    } catch (e) {
      _error = 'Failed to create money lent record';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateMoneyLent(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateMoneyLent(id, data);
      await loadMoneyLent();
      return true;
    } catch (e) {
      _error = 'Failed to update money lent record';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteMoneyLent(int id) async {
    try {
      await _apiService.deleteMoneyLent(id);
      await loadMoneyLent();
      return true;
    } catch (e) {
      _error = 'Failed to delete money lent record';
      notifyListeners();
      return false;
    }
  }

  Future<bool> recordPayment(int id, double amount) async {
    try {
      await _apiService.recordPayment(id, amount);
      await loadMoneyLent();
      return true;
    } catch (e) {
      _error = 'Failed to record payment';
      notifyListeners();
      return false;
    }
  }

  List<MoneyLent> get overdueMoneyLent {
    return _moneyLentRecords.where((record) => record.isOverdue).toList();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}