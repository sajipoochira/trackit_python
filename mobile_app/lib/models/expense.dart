class Expense {
  final int id;
  final String title;
  final double amount;
  final String category;
  final String categoryDisplay;
  final String currency;
  final String currencyDisplay;
  final double amountInInr;
  final DateTime date;
  final String? notes;
  final DateTime createdAt;
  final Map<String, dynamic>? budgetInfo;

  Expense({
    required this.id,
    required this.title,
    required this.amount,
    required this.category,
    required this.categoryDisplay,
    required this.currency,
    required this.currencyDisplay,
    required this.amountInInr,
    required this.date,
    this.notes,
    required this.createdAt,
    this.budgetInfo,
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'],
      title: json['title'],
      amount: json['amount'].toDouble(),
      category: json['category'],
      categoryDisplay: json['category_display'],
      currency: json['currency'],
      currencyDisplay: json['currency_display'],
      amountInInr: json['amount_in_inr'].toDouble(),
      date: DateTime.parse(json['date']),
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      budgetInfo: json['budget_info'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'amount': amount,
      'category': category,
      'currency': currency,
      'date': date.toIso8601String().split('T')[0],
      'notes': notes,
    };
  }
}