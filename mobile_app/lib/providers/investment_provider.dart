import 'package:flutter/material.dart';
import '../models/investment.dart';
import '../services/api_service.dart';

class InvestmentProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Investment> _investments = [];
  bool _isLoading = false;
  String? _error;

  List<Investment> get investments => _investments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  double get totalInvested => _investments.fold(0, (sum, inv) => sum + inv.totalInvested);
  double get totalCurrent => _investments.fold(0, (sum, inv) => sum + inv.totalCurrent);
  double get totalGainLoss => totalCurrent - totalInvested;
  double get gainLossPercentage => totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  Future<void> loadInvestments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getInvestments();
      _investments = data.map<Investment>((json) => Investment.fromJson(json)).toList();
    } catch (e) {
      _error = 'Failed to load investments';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createInvestment(Investment investment) async {
    try {
      await _apiService.createInvestment(investment.toJson());
      await loadInvestments();
      return true;
    } catch (e) {
      _error = 'Failed to create investment';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateInvestment(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateInvestment(id, data);
      await loadInvestments();
      return true;
    } catch (e) {
      _error = 'Failed to update investment';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteInvestment(int id) async {
    try {
      await _apiService.deleteInvestment(id);
      await loadInvestments();
      return true;
    } catch (e) {
      _error = 'Failed to delete investment';
      notifyListeners();
      return false;
    }
  }

  Future<void> refreshStockPrices() async {
    _isLoading = true;
    notifyListeners();

    int updatedCount = 0;
    for (final investment in _investments.where((inv) => inv.symbol != null && inv.type == 'Stock')) {
      try {
        final priceData = await _apiService.getStockPrice(investment.symbol!);
        final newCurrentValue = priceData['ltp'] * investment.qty;
        
        await _apiService.updateInvestment(investment.id, {
          'current_value': newCurrentValue / investment.qty,
        });
        updatedCount++;
      } catch (e) {
        // Continue with other stocks even if one fails
      }
    }

    if (updatedCount > 0) {
      await loadInvestments();
    }

    _isLoading = false;
    notifyListeners();
  }

  Map<String, List<Investment>> get investmentsByType {
    final Map<String, List<Investment>> grouped = {};
    for (final investment in _investments) {
      if (!grouped.containsKey(investment.type)) {
        grouped[investment.type] = [];
      }
      grouped[investment.type]!.add(investment);
    }
    return grouped;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}