import 'package:flutter/material.dart';
import '../../models/investment.dart';
import '../../utils/theme.dart';

class InvestmentCard extends StatefulWidget {
  final Investment investment;
  final Function(int, Map<String, dynamic>) onEdit;
  final Function(int) onDelete;

  const InvestmentCard({
    Key? key,
    required this.investment,
    required this.onEdit,
    required this.onDelete,
  }) : super(key: key);

  @override
  State<InvestmentCard> createState() => _InvestmentCardState();
}

class _InvestmentCardState extends State<InvestmentCard> {
  bool _isEditing = false;
  final _qtyController = TextEditingController();
  final _purchaseValueController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _qtyController.text = widget.investment.qty.toString();
    _purchaseValueController.text = widget.investment.purchaseValue.toString();
  }

  @override
  void dispose() {
    _qtyController.dispose();
    _purchaseValueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final investment = widget.investment;
    final isProfit = investment.isProfit;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        investment.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              investment.type,
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                          if (investment.symbol != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.infoColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                investment.symbol!,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.infoColor,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      setState(() => _isEditing = true);
                    } else if (value == 'delete') {
                      _showDeleteConfirmation();
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: Text('Edit'),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete'),
                    ),
                  ],
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            if (_isEditing) ...[
              // Edit Form
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qtyController,
                      decoration: const InputDecoration(
                        labelText: 'Quantity',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _purchaseValueController,
                      decoration: const InputDecoration(
                        labelText: 'Purchase Value',
                        isDense: true,
                      ),
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  ElevatedButton(
                    onPressed: _saveChanges,
                    child: const Text('Save'),
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () => setState(() => _isEditing = false),
                    child: const Text('Cancel'),
                  ),
                ],
              ),
            ] else ...[
              // Investment Details
              Row(
                children: [
                  Expanded(
                    child: _buildDetailItem('Quantity', investment.qty.toString()),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                      'Purchase Value',
                      '₹${investment.purchaseValue.toStringAsFixed(2)}',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDetailItem(
                      'Current Value',
                      '₹${investment.currentValue.toStringAsFixed(2)}',
                    ),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                      'Total Invested',
                      '₹${investment.totalInvested.toStringAsFixed(2)}',
                      color: AppTheme.infoColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildDetailItem(
                      'Total Current',
                      '₹${investment.totalCurrent.toStringAsFixed(2)}',
                      color: AppTheme.primaryColor,
                    ),
                  ),
                  Expanded(
                    child: _buildDetailItem(
                      'Gain/Loss',
                      '${isProfit ? '+' : ''}₹${investment.gainLoss.toStringAsFixed(2)}',
                      color: isProfit ? AppTheme.secondaryColor : AppTheme.errorColor,
                      subtitle: '${isProfit ? '+' : ''}${investment.gainLossPercentage.toStringAsFixed(2)}%',
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Progress Bar
              LinearProgressIndicator(
                value: investment.gainLossPercentage.abs() / 100,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation<Color>(
                  isProfit ? AppTheme.secondaryColor : AppTheme.errorColor,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value, {Color? color, String? subtitle}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
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
            style: TextStyle(
              fontSize: 10,
              color: color ?? Colors.grey,
            ),
          ),
        ],
      ],
    );
  }

  void _saveChanges() {
    final qty = int.tryParse(_qtyController.text);
    final purchaseValue = double.tryParse(_purchaseValueController.text);

    if (qty != null && purchaseValue != null && qty > 0 && purchaseValue > 0) {
      widget.onEdit(widget.investment.id, {
        'qty': qty,
        'purchase_value': purchaseValue,
      });
      setState(() => _isEditing = false);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter valid values')),
      );
    }
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Investment'),
        content: Text('Are you sure you want to delete "${widget.investment.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              widget.onDelete(widget.investment.id);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}