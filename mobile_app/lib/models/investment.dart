class Investment {
  final int id;
  final String name;
  final String? symbol;
  final String type;
  final int qty;
  final double currentValue;
  final double purchaseValue;
  final String currency;
  final double amountInInr;
  final DateTime createdAt;
  final DateTime? lastUpdated;

  Investment({
    required this.id,
    required this.name,
    this.symbol,
    required this.type,
    required this.qty,
    required this.currentValue,
    required this.purchaseValue,
    required this.currency,
    required this.amountInInr,
    required this.createdAt,
    this.lastUpdated,
  });

  factory Investment.fromJson(Map<String, dynamic> json) {
    return Investment(
      id: json['id'],
      name: json['name'],
      symbol: json['symbol'],
      type: json['type'],
      qty: json['qty'],
      currentValue: json['current_value'].toDouble(),
      purchaseValue: json['purchase_value'].toDouble(),
      currency: json['currency'],
      amountInInr: json['amount_in_inr'].toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      lastUpdated: json['last_updated'] != null 
          ? DateTime.parse(json['last_updated']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'symbol': symbol,
      'type': type,
      'qty': qty,
      'current_value': currentValue,
      'purchase_value': purchaseValue,
      'currency': currency,
    };
  }

  double get totalInvested => qty * purchaseValue;
  double get totalCurrent => qty * currentValue;
  double get gainLoss => totalCurrent - totalInvested;
  double get gainLossPercentage => totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  bool get isProfit => gainLoss >= 0;
}