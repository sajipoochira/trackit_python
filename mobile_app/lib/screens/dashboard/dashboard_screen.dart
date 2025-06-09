import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/dashboard_provider.dart';
import '../../providers/investment_provider.dart';
import '../../providers/income_provider.dart';
import '../../providers/expense_provider.dart';
import '../../providers/asset_provider.dart';
import '../../providers/liability_provider.dart';
import '../../utils/theme.dart';
import '../shared/main_layout.dart';
import '../../widgets/dashboard/summary_card.dart';
import '../../widgets/dashboard/portfolio_chart.dart';
import '../../widgets/dashboard/recent_transactions.dart';
import '../../widgets/dashboard/budget_alerts.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDashboardData();
    });
  }

  Future<void> _loadDashboardData() async {
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    final investmentProvider = Provider.of<InvestmentProvider>(context, listen: false);
    final incomeProvider = Provider.of<IncomeProvider>(context, listen: false);
    final expenseProvider = Provider.of<ExpenseProvider>(context, listen: false);
    final assetProvider = Provider.of<AssetProvider>(context, listen: false);
    final liabilityProvider = Provider.of<LiabilityProvider>(context, listen: false);

    await dashboardProvider.loadAllData(
      investmentProvider: investmentProvider,
      incomeProvider: incomeProvider,
      expenseProvider: expenseProvider,
      assetProvider: assetProvider,
      liabilityProvider: liabilityProvider,
    );
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      currentIndex: 0,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Financial Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadDashboardData,
            ),
          ],
        ),
        body: Consumer6<DashboardProvider, InvestmentProvider, IncomeProvider, 
            ExpenseProvider, AssetProvider, LiabilityProvider>(
          builder: (context, dashboardProvider, investmentProvider, incomeProvider,
              expenseProvider, assetProvider, liabilityProvider, child) {
            
            if (dashboardProvider.isLoading) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            if (dashboardProvider.error != null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.red.shade300,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      dashboardProvider.error!,
                      style: const TextStyle(fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: _loadDashboardData,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            final netWorth = dashboardProvider.calculateNetWorth(
              investmentProvider: investmentProvider,
              assetProvider: assetProvider,
              liabilityProvider: liabilityProvider,
            );

            final cashFlow = dashboardProvider.calculateMonthlyCashFlow(
              incomeProvider: incomeProvider,
              expenseProvider: expenseProvider,
            );

            return RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Key Metrics Row
                    Row(
                      children: [
                        Expanded(
                          child: SummaryCard(
                            title: 'Net Worth',
                            value: '₹${netWorth.toStringAsFixed(2)}',
                            icon: Icons.account_balance_wallet,
                            color: AppTheme.primaryColor,
                            subtitle: 'Total Assets - Liabilities',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SummaryCard(
                            title: 'Monthly Cash Flow',
                            value: '${cashFlow['netCashFlow']! >= 0 ? '+' : ''}₹${cashFlow['netCashFlow']!.toStringAsFixed(2)}',
                            icon: cashFlow['netCashFlow']! >= 0 ? Icons.trending_up : Icons.trending_down,
                            color: cashFlow['netCashFlow']! >= 0 ? AppTheme.secondaryColor : AppTheme.errorColor,
                            subtitle: 'Income - Expenses',
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Secondary Metrics Row
                    Row(
                      children: [
                        Expanded(
                          child: SummaryCard(
                            title: 'Investments',
                            value: '₹${investmentProvider.totalCurrent.toStringAsFixed(2)}',
                            icon: Icons.trending_up,
                            color: AppTheme.infoColor,
                            subtitle: '${investmentProvider.gainLossPercentage >= 0 ? '+' : ''}${investmentProvider.gainLossPercentage.toStringAsFixed(2)}%',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SummaryCard(
                            title: 'Total Assets',
                            value: '₹${assetProvider.totalValueInr.toStringAsFixed(2)}',
                            icon: Icons.home,
                            color: AppTheme.warningColor,
                            subtitle: '${assetProvider.assets.length} items',
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Monthly Overview Row
                    Row(
                      children: [
                        Expanded(
                          child: SummaryCard(
                            title: 'Monthly Income',
                            value: '₹${cashFlow['income']!.toStringAsFixed(2)}',
                            icon: Icons.attach_money,
                            color: AppTheme.secondaryColor,
                            subtitle: '${incomeProvider.incomes.length} entries',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: SummaryCard(
                            title: 'Monthly Expenses',
                            value: '₹${cashFlow['expenses']!.toStringAsFixed(2)}',
                            icon: Icons.credit_card,
                            color: AppTheme.errorColor,
                            subtitle: '${expenseProvider.expenses.length} entries',
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Portfolio Breakdown
                    if (investmentProvider.investments.isNotEmpty)
                      PortfolioChart(
                        investments: investmentProvider.investments,
                      ),
                    
                    const SizedBox(height: 24),
                    
                    // Recent Transactions
                    RecentTransactions(
                      incomes: incomeProvider.incomes,
                      expenses: expenseProvider.expenses,
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Budget Alerts
                    if (expenseProvider.budgetSummary != null)
                      BudgetAlerts(
                        budgetSummary: expenseProvider.budgetSummary!,
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}