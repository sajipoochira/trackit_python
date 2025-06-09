class Income {
  final int id;
  final String source;
  final String category;
  final String categoryDisplay;
  final double amount;
  final String currency;
  final String currencyDisplay;
  final double amountInInr;
  final DateTime date;
  final bool isRecurring;
  final String? recurringPeriod;
  final String? recurringPeriodDisplay;
  final DateTime? nextOccurrence;
  final String? notes;
  final DateTime createdAt;

  Income({
    required this.id,
    required this.source,
    required this.category,
    required this.categoryDisplay,
    required this.amount,
    required this.currency,
    required this.currencyDisplay,
    required this.amountInInr,
    required this.date,
    required this.isRecurring,
    this.recurringPeriod,
    this.recurringPeriodDisplay,
    this.nextOccurrence,
    this.notes,
    required this.createdAt,
  });

  factory Income.fromJson(Map<String, dynamic> json) {
    return Income(
      id: json['id'],
      source: json['source'],
      category: json['category'],
      categoryDisplay: json['category_display'],
      amount: json['amount'].toDouble(),
      currency: json['currency'],
      currencyDisplay: json['currency_display'],
      amountInInr: json['amount_in_inr'].toDouble(),
      date: DateTime.parse(json['date']),
      isRecurring: json['is_recurring'],
      recurringPeriod: json['recurring_period'],
      recurringPeriodDisplay: json['recurring_period_display'],
      nextOccurrence: json['next_occurrence'] != null 
          ? DateTime.parse(json['next_occurrence']) 
          : null,
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'source': source,
      'category': category,
      'amount': amount,
      'currency': currency,
      'date': date.toIso8601String().split('T')[0],
      'is_recurring': isRecurring,
      'recurring_period': recurringPeriod,
      'notes': notes,
    };
  }
}