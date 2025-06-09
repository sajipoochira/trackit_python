class Liability {
  final int id;
  final String name;
  final String type;
  final String typeDisplay;
  final double principalAmount;
  final double currentBalance;
  final String currency;
  final String currencyDisplay;
  final double? interestRate;
  final double? monthlyPayment;
  final DateTime startDate;
  final DateTime? dueDate;
  final DateTime? nextPaymentDate;
  final String status;
  final String statusDisplay;
  final String? lenderName;
  final String? notes;
  final double principalAmountInInr;
  final double currentBalanceInInr;
  final double monthlyPaymentInInr;
  final double paidAmount;
  final double paidAmountInInr;
  final double completionPercentage;
  final DateTime createdAt;
  final DateTime updatedAt;

  Liability({
    required this.id,
    required this.name,
    required this.type,
    required this.typeDisplay,
    required this.principalAmount,
    required this.currentBalance,
    required this.currency,
    required this.currencyDisplay,
    this.interestRate,
    this.monthlyPayment,
    required this.startDate,
    this.dueDate,
    this.nextPaymentDate,
    required this.status,
    required this.statusDisplay,
    this.lenderName,
    this.notes,
    required this.principalAmountInInr,
    required this.currentBalanceInInr,
    required this.monthlyPaymentInInr,
    required this.paidAmount,
    required this.paidAmountInInr,
    required this.completionPercentage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Liability.fromJson(Map<String, dynamic> json) {
    return Liability(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      typeDisplay: json['type_display'],
      principalAmount: json['principal_amount'].toDouble(),
      currentBalance: json['current_balance'].toDouble(),
      currency: json['currency'],
      currencyDisplay: json['currency_display'],
      interestRate: json['interest_rate']?.toDouble(),
      monthlyPayment: json['monthly_payment']?.toDouble(),
      startDate: DateTime.parse(json['start_date']),
      dueDate: json['due_date'] != null ? DateTime.parse(json['due_date']) : null,
      nextPaymentDate: json['next_payment_date'] != null 
          ? DateTime.parse(json['next_payment_date']) : null,
      status: json['status'],
      statusDisplay: json['status_display'],
      lenderName: json['lender_name'],
      notes: json['notes'],
      principalAmountInInr: json['principal_amount_in_inr'].toDouble(),
      currentBalanceInInr: json['current_balance_in_inr'].toDouble(),
      monthlyPaymentInInr: json['monthly_payment_in_inr'].toDouble(),
      paidAmount: json['paid_amount'].toDouble(),
      paidAmountInInr: json['paid_amount_in_inr'].toDouble(),
      completionPercentage: json['completion_percentage'].toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'principal_amount': principalAmount,
      'current_balance': currentBalance,
      'currency': currency,
      'interest_rate': interestRate,
      'monthly_payment': monthlyPayment,
      'start_date': startDate.toIso8601String().split('T')[0],
      'due_date': dueDate?.toIso8601String().split('T')[0],
      'next_payment_date': nextPaymentDate?.toIso8601String().split('T')[0],
      'status': status,
      'lender_name': lenderName,
      'notes': notes,
    };
  }
}