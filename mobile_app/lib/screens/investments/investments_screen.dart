import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/investment_provider.dart';
import '../../models/investment.dart';
import '../../utils/constants.dart';
import '../../utils/theme.dart';
import '../shared/main_layout.dart';
import '../../widgets/investments/investment_card.dart';
import '../../widgets/investments/add_investment_form.dart';

class InvestmentsScreen extends StatefulWidget {
  const InvestmentsScreen({super.key});

  @override
  State<InvestmentsScreen> createState() => _InvestmentsScreenState();
}

class _InvestmentsScreenState extends State<InvestmentsScreen> {
  String? _selectedType;
  String _viewMode = 'tiles'; // tiles, list, consolidated

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<InvestmentProvider>(context, listen: false).loadInvestments();
    });
  }

  @override
  Widget build(BuildContext context) {
    return MainLayout(
      currentIndex: 1,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_selectedType ?? 'Investments'),
          actions: [
            if (_selectedType != null)
              IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedType = null),
              ),
            PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'refresh_prices') {
                  Provider.of<InvestmentProvider>(context, listen: false)
                      .refreshStockPrices();
                } else {
                  setState(() => _viewMode = value);
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'tiles',
                  child: Text('Tile View'),
                ),
                const PopupMenuItem(
                  value: 'list',
                  child: Text('List View'),
                ),
                const PopupMenuItem(
                  value: 'consolidated',
                  child: Text('Consolidated View'),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(
                  value: 'refresh_prices',
                  child: Text('Refresh Stock Prices'),
                ),
              ],
            ),
          ],
        ),
        body: Consumer<InvestmentProvider>(
          builder: (context, provider, child) {
            if (provider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (provider.error != null) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
                    const SizedBox(height: 16),
                    Text(provider.error!),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => provider.loadInvestments(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            if (provider.investments.isEmpty) {
              return _buildEmptyState();
            }

            return Column(
              children: [
                _buildSummaryCards(provider),
                if (_viewMode == 'consolidated' && _selectedType == null)
                  _buildTypeFilter(provider),
                Expanded(
                  child: _buildInvestmentsList(provider),
                ),
              ],
            );
          },
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showAddInvestmentForm(context),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.trending_up, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          const Text(
            'No investments yet',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start tracking your investments by adding your first one!',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => _showAddInvestmentForm(context),
            child: const Text('Add Your First Investment'),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(InvestmentProvider provider) {
    final filteredInvestments = _selectedType != null
        ? provider.investments.where((inv) => inv.type == _selectedType).toList()
        : provider.investments;

    final totalInvested = filteredInvestments.fold(0.0, (sum, inv) => sum + inv.totalInvested);
    final totalCurrent = filteredInvestments.fold(0.0, (sum, inv) => sum + inv.totalCurrent);
    final totalGainLoss = totalCurrent - totalInvested;
    final gainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildSummaryCard(
              'Total Invested',
              '₹${totalInvested.toStringAsFixed(2)}',
              Icons.account_balance_wallet,
              AppTheme.infoColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildSummaryCard(
              'Current Value',
              '₹${totalCurrent.toStringAsFixed(2)}',
              Icons.trending_up,
              AppTheme.primaryColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildSummaryCard(
              'Gain/Loss',
              '${totalGainLoss >= 0 ? '+' : ''}₹${totalGainLoss.toStringAsFixed(2)}',
              totalGainLoss >= 0 ? Icons.trending_up : Icons.trending_down,
              totalGainLoss >= 0 ? AppTheme.secondaryColor : AppTheme.errorColor,
              subtitle: '${gainLossPercentage >= 0 ? '+' : ''}${gainLossPercentage.toStringAsFixed(2)}%',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color, {String? subtitle}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(fontSize: 10, color: color),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypeFilter(InvestmentProvider provider) {
    final investmentsByType = provider.investmentsByType;

    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: investmentsByType.length,
        itemBuilder: (context, index) {
          final entry = investmentsByType.entries.elementAt(index);
          final type = entry.key;
          final investments = entry.value;
          final totalValue = investments.fold(0.0, (sum, inv) => sum + inv.totalCurrent);
          final totalInvested = investments.fold(0.0, (sum, inv) => sum + inv.totalInvested);
          final gainLoss = totalValue - totalInvested;
          final gainLossPercentage = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

          return GestureDetector(
            onTap: () => setState(() => _selectedType = type),
            child: Container(
              width: 140,
              margin: const EdgeInsets.only(right: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          type,
                          style: const TextStyle(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right, size: 16),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '₹${totalValue.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${gainLoss >= 0 ? '+' : ''}${gainLossPercentage.toStringAsFixed(2)}%',
                    style: TextStyle(
                      fontSize: 12,
                      color: gainLoss >= 0 ? AppTheme.secondaryColor : AppTheme.errorColor,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${investments.length} investment${investments.length != 1 ? 's' : ''}',
                    style: const TextStyle(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInvestmentsList(InvestmentProvider provider) {
    final investments = _selectedType != null
        ? provider.investments.where((inv) => inv.type == _selectedType).toList()
        : provider.investments;

    if (_viewMode == 'consolidated' && _selectedType == null) {
      return _buildTypeFilter(provider);
    }

    return RefreshIndicator(
      onRefresh: () => provider.loadInvestments(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: investments.length,
        itemBuilder: (context, index) {
          final investment = investments[index];
          return InvestmentCard(
            investment: investment,
            onEdit: (id, data) => provider.updateInvestment(id, data),
            onDelete: (id) => provider.deleteInvestment(id),
          );
        },
      ),
    );
  }

  void _showAddInvestmentForm(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddInvestmentForm(
        onSubmit: (investment) {
          Provider.of<InvestmentProvider>(context, listen: false)
              .createInvestment(investment);
        },
      ),
    );
  }
}