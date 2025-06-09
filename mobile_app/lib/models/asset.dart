class Asset {
  final int id;
  final String name;
  final String type;
  final String typeDisplay;
  final double value;
  final String currency;
  final String currencyDisplay;
  final double valueInInr;
  final DateTime? purchaseDate;
  final String? notes;
  final DateTime createdAt;
  final String? accountNumber;
  final String? bankName;
  final String? accountType;

  Asset({
    required this.id,
    required this.name,
    required this.type,
    required this.typeDisplay,
    required this.value,
    required this.currency,
    required this.currencyDisplay,
    required this.valueInInr,
    this.purchaseDate,
    this.notes,
    required this.createdAt,
    this.accountNumber,
    this.bankName,
    this.accountType,
  });

  factory Asset.fromJson(Map<String, dynamic> json) {
    return Asset(
      id: json['id'],
      name: json['name'],
      type: json['type'],
      typeDisplay: json['type_display'],
      value: json['value'].toDouble(),
      currency: json['currency'],
      currencyDisplay: json['currency_display'],
      valueInInr: json['value_in_inr'].toDouble(),
      purchaseDate: json['purchase_date'] != null 
          ? DateTime.parse(json['purchase_date']) 
          : null,
      notes: json['notes'],
      createdAt: DateTime.parse(json['created_at']),
      accountNumber: json['account_number'],
      bankName: json['bank_name'],
      accountType: json['account_type'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'value': value,
      'currency': currency,
      'purchase_date': purchaseDate?.toIso8601String().split('T')[0],
      'notes': notes,
      'account_number': accountNumber,
      'bank_name': bankName,
      'account_type': accountType,
    };
  }

  bool get isBankAccount => type == 'bank_account';
}