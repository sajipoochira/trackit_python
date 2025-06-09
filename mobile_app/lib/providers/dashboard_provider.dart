import 'package:flutter/material.dart';
import 'investment_provider.dart';
import 'income_provider.dart';
import 'expense_provider.dart';
import 'asset_provider.dart';
import 'liability_provider.dart';

class DashboardProvider with ChangeNotifier {
  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAllData({
    required InvestmentProvider investmentProvider,
    required IncomeProvider incomeProvider,
    required ExpenseProvider expenseProvider,
    required AssetProvider assetProvider,
    required LiabilityProvider liabilityProvider,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Future.wait([
        investmentProvider.loadInvestments(),
        incomeProvider.loadIncomes(),
        expenseProvider.loadExpenses(),
        expenseProvider.loadBudgets(),
        assetProvider.loadAssets(),
        liabilityProvider.loadAll(),
      ]);
    } catch (e) {
      _error = 'Failed to load dashboard data';
    }

    _isLoading = false;
    notifyListeners();
  }

  double calculateNetWorth({
    required InvestmentProvider investmentProvider,
    required AssetProvider assetProvider,
    required LiabilityProvider liabilityProvider,
  }) {
    final investmentValue = investmentProvider.totalCurrent;
    final assetValue = assetProvider.totalValueInr;
    final debtValue = liabilityProvider.totalDebtInr;
    final moneyLentValue = liabilityProvider.totalOutstandingInr;
    
    return investmentValue + assetValue - debtValue + moneyLentValue;
  }

  Map<String, double> calculateMonthlyCashFlow({
    required IncomeProvider incomeProvider,
    required ExpenseProvider expenseProvider,
  }) {
    final currentMonth = DateTime.now().month;
    final currentYear = DateTime.now().year;
    
    final monthlyIncome = incomeProvider.incomes
        .where((income) => 
            income.date.month == currentMonth && 
            income.date.year == currentYear)
        .fold(0.0, (sum, income) => sum + income.amountInInr);

    final monthlyExpenses = expenseProvider.expenses
        .where((expense) => 
            expense.date.month == currentMonth && 
            expense.date.year == currentYear)
        .fold(0.0, (sum, expense) => sum + expense.amountInInr);

    return {
      'income': monthlyIncome,
      'expenses': monthlyExpenses,
      'netCashFlow': monthlyIncome - monthlyExpenses,
    };
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}