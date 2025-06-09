class MoneyLent {
  final int id;
  final String borrowerName;
  final double amountLent;
  final double amountReturned;
  final String currency;
  final String currencyDisplay;
  final DateTime dateLent;
  final DateTime? expectedReturnDate;
  final String status;
  final String statusDisplay;
  final String? borrowerContact;
  final String? purpose;
  final String? notes;
  final double amountLentInInr;
  final double amountReturnedInInr;
  final double outstandingAmount;
  final double outstandingAmountInInr;
  final double returnPercentage;
  final DateTime createdAt;
  final DateTime updatedAt;

  MoneyLent({
    required this.id,
    required this.borrowerName,
    required this.amountLent,
    required this.amountReturned,
    required this.currency,
    required this.currencyDisplay,
    required this.dateLent,
    this.expectedReturnDate,
    required this.status,
    required this.statusDisplay,
    this.borrowerContact,
    this.purpose,
    this.notes,
    required this.amountLentInInr,
    required this.amountReturnedInInr,
    required this.outstandingAmount,
    required this.outstandingAmountInInr,
    required this.returnPercentage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MoneyLent.fromJson(Map<String, dynamic> json) {
    return MoneyLent(
      id: json['id'],
      borrowerName: json['borrower_name'],
      amountLent: json['amount_lent'].toDouble(),
      amountReturned: json['amount_returned'].toDouble(),
      currency: json['currency'],
      currencyDisplay: json['currency_display'],
      dateLent: DateTime.parse(json['date_lent']),
      expectedReturnDate: json['expected_return_date'] != null 
          ? DateTime.parse(json['expected_return_date']) : null,
      status: json['status'],
      statusDisplay: json['status_display'],
      borrowerContact: json['borrower_contact'],
      purpose: json['purpose'],
      notes: json['notes'],
      amountLentInInr: json['amount_lent_in_inr'].toDouble(),
      amountReturnedInInr: json['amount_returned_in_inr'].toDouble(),
      outstandingAmount: json['outstanding_amount'].toDouble(),
      outstandingAmountInInr: json['outstanding_amount_in_inr'].toDouble(),
      returnPercentage: json['return_percentage'].toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'borrower_name': borrowerName,
      'amount_lent': amountLent,
      'amount_returned': amountReturned,
      'currency': currency,
      'date_lent': dateLent.toIso8601String().split('T')[0],
      'expected_return_date': expectedReturnDate?.toIso8601String().split('T')[0],
      'status': status,
      'borrower_contact': borrowerContact,
      'purpose': purpose,
      'notes': notes,
    };
  }

  bool get isOverdue {
    if (expectedReturnDate == null || status == 'fully_returned') return false;
    return expectedReturnDate!.isBefore(DateTime.now());
  }
}