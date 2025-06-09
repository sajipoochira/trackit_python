import 'package:flutter/material.dart';
import '../../utils/theme.dart';

class BudgetAlerts extends StatelessWidget {
  final Map<String, dynamic> budgetSummary;

  const BudgetAlerts({
    super.key,
    required this.budgetSummary,
  });

  @override
  Widget build(BuildContext context) {
    final budgets = budgetSummary['budgets'] as List<dynamic>? ?? [];
    final alertBudgets = budgets.where((budget) => 
        budget['utilization_percentage'] > 80).toList();

    if (alertBudgets.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.warning,
                  color: AppTheme.warningColor,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Budget Alerts',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...alertBudgets.map((budget) {
              final utilization = budget['utilization_percentage'] as double;
              final isOverBudget = utilization > 100;
              
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isOverBudget 
                      ? AppTheme.errorColor.withOpacity(0.1)
                      : AppTheme.warningColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: isOverBudget 
                        ? AppTheme.errorColor.withOpacity(0.3)
                        : AppTheme.warningColor.withOpacity(0.3),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          budget['category'],
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                        Text(
                          '${utilization.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isOverBudget ? AppTheme.errorColor : AppTheme.warningColor,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: utilization / 100,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        isOverBudget ? AppTheme.errorColor : AppTheme.warningColor,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '₹${budget['remaining_amount'].toStringAsFixed(2)} remaining of ₹${budget['allocated_amount_inr'].toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}