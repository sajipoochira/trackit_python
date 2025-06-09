import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/investment.dart';
import '../../utils/theme.dart';

class PortfolioChart extends StatelessWidget {
  final List<Investment> investments;

  const PortfolioChart({
    super.key,
    required this.investments,
  });

  @override
  Widget build(BuildContext context) {
    final portfolioData = _getPortfolioData();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Investment Portfolio Breakdown',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: PieChart(
                PieChartData(
                  sections: portfolioData.entries.map((entry) {
                    return PieChartSectionData(
                      value: entry.value['value'],
                      title: '${entry.value['percentage'].toStringAsFixed(1)}%',
                      color: entry.value['color'],
                      radius: 80,
                      titleStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    );
                  }).toList(),
                  centerSpaceRadius: 40,
                  sectionsSpace: 2,
                ),
              ),
            ),
            const SizedBox(height: 16),
            ...portfolioData.entries.map((entry) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: entry.value['color'],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(entry.key),
                    ),
                    Text(
                      '₹${entry.value['value'].toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w500),
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

  Map<String, Map<String, dynamic>> _getPortfolioData() {
    final Map<String, double> typeValues = {};
    double totalValue = 0;

    for (final investment in investments) {
      final value = investment.totalCurrent;
      typeValues[investment.type] = (typeValues[investment.type] ?? 0) + value;
      totalValue += value;
    }

    final colors = [
      AppTheme.primaryColor,
      AppTheme.secondaryColor,
      AppTheme.errorColor,
      AppTheme.warningColor,
      AppTheme.infoColor,
      Colors.purple,
      Colors.orange,
      Colors.teal,
      Colors.indigo,
    ];

    final Map<String, Map<String, dynamic>> result = {};
    int colorIndex = 0;

    typeValues.forEach((type, value) {
      result[type] = {
        'value': value,
        'percentage': totalValue > 0 ? (value / totalValue) * 100 : 0,
        'color': colors[colorIndex % colors.length],
      };
      colorIndex++;
    });

    return result;
  }
}