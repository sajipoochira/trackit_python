import 'package:flutter/material.dart';
import '../../models/investment.dart';
import '../../utils/constants.dart';

class AddInvestmentForm extends StatefulWidget {
  final Function(Investment) onSubmit;

  const AddInvestmentForm({
    Key? key,
    required this.onSubmit,
  }) : super(key: key);

  @override
  State<AddInvestmentForm> createState() => _AddInvestmentFormState();
}

class _AddInvestmentFormState extends State<AddInvestmentForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _symbolController = TextEditingController();
  final _qtyController = TextEditingController(text: '1');
  final _currentValueController = TextEditingController();
  final _purchaseValueController = TextEditingController();
  
  String _selectedType = '';
  String _selectedCurrency = 'INR';

  @override
  void dispose() {
    _nameController.dispose();
    _symbolController.dispose();
    _qtyController.dispose();
    _currentValueController.dispose();
    _purchaseValueController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
                alignment: Alignment.center,
              ),
              
              const Text(
                'Add New Investment',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 24),
              
              // Investment Name
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Investment Name',
                  hintText: 'e.g., Reliance Stock, Gold Coins',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter investment name';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Investment Type
              DropdownButtonFormField<String>(
                value: _selectedType.isEmpty ? null : _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Investment Type',
                ),
                items: AppConstants.investmentTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedType = value ?? '');
                },
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please select investment type';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Symbol (optional for stocks)
              if (_selectedType == 'Stock')
                Column(
                  children: [
                    TextFormField(
                      controller: _symbolController,
                      decoration: const InputDecoration(
                        labelText: 'Stock Symbol (Optional)',
                        hintText: 'e.g., RELIANCE, TCS, INFY',
                      ),
                      textCapitalization: TextCapitalization.characters,
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              
              // Quantity and Values
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _qtyController,
                      decoration: const InputDecoration(
                        labelText: 'Quantity',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        final qty = int.tryParse(value);
                        if (qty == null || qty <= 0) {
                          return 'Invalid quantity';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _selectedCurrency,
                      decoration: const InputDecoration(
                        labelText: 'Currency',
                      ),
                      items: AppConstants.currencies.map((currency) {
                        return DropdownMenuItem(
                          value: currency['value'],
                          child: Text(currency['label']!),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedCurrency = value ?? 'INR');
                      },
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _purchaseValueController,
                      decoration: const InputDecoration(
                        labelText: 'Purchase Value (per unit)',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        final price = double.tryParse(value);
                        if (price == null || price <= 0) {
                          return 'Invalid price';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    
                    child: TextFormField(
                      controller: _currentValueController,
                      decoration: const InputDecoration(
                        labelText: 'Current Value (per unit)',
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        final price = double.tryParse(value);
                        if (price == null || price <= 0) {
                          return 'Invalid price';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Buttons
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _submitForm,
                      child: const Text('Add Investment'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      final investment = Investment(
        id: 0, // Will be set by the server
        name: _nameController.text.trim(),
        symbol: _symbolController.text.trim().isEmpty ? null : _symbolController.text.trim(),
        type: _selectedType,
        qty: int.parse(_qtyController.text),
        currentValue: double.parse(_currentValueController.text),
        purchaseValue: double.parse(_purchaseValueController.text),
        currency: _selectedCurrency,
        amountInInr: 0, // Will be calculated by the server
        createdAt: DateTime.now(),
      );

      widget.onSubmit(investment);
      Navigator.pop(context);
    }
  }
}