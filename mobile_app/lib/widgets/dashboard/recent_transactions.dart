import 'package:flutter/material.dart';
import '../../models/income.dart';
import '../../models/expense.dart';
import '../../utils/theme.dart';

class RecentTransactions extends StatelessWidget {
  final List<Income> incomes;
  final List<Expense> expenses;

  const RecentTransactions({
    super.key,
    required this.incomes,
    required this.expenses,
  });

  @override
  Widget build(BuildContext context) {
    final recentTransactions = _getRecentTransactions();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recent Transactions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            if (recentTransactions.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: Text(
                    'No transactions yet',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ...recentTransactions.take(8).map((transaction) {
                final isIncome = transaction['type'] == 'income';
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: isIncome 
                        ? AppTheme.secondaryColor.withOpacity(0.1)
                        : AppTheme.errorColor.withOpacity(0.1),
                    child: Icon(
                      isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                      color: isIncome ? AppTheme.secondaryColor : AppTheme.errorColor,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    transaction['title'],
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  subtitle: Text(
                    '${transaction['category']} • ${_formatDate(transaction['date'])}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Text(
                    '${isIncome ? '+' : '-'}₹${transaction['amount'].toStringAsFixed(2)}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: isIncome ? AppTheme.secondaryColor : AppTheme.errorColor,
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getRecentTransactions() {
    final List<Map<String, dynamic>> transactions = [];

    // Add incomes
    for (final income in incomes) {
      transactions.add({
        'type': 'income',
        'title': income.source,
        'category': income.categoryDisplay,
        'amount': income.amountInInr,
        'date': income.date,
      });
    }

    // Add expenses
    for (final expense in expenses) {
      transactions.add({
        'type': 'expense',
        'title': expense.title,
        'category': expense.categoryDisplay,
        'amount': expense.amountInInr,
        'date': expense.date,
      });
    }

    // Sort by date (most recent first)
    transactions.sort((a, b) => b['date'].compareTo(a['date']));

    return transactions;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date).inDays;

    if (difference == 0) {
      return 'Today';
    } else if (difference == 1) {
      return 'Yesterday';
    } else if (difference < 7) {
      return '$difference days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}