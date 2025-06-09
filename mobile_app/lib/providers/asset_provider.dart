import 'package:flutter/material.dart';
import '../models/asset.dart';
import '../services/api_service.dart';

class AssetProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Asset> _assets = [];
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _summary;

  List<Asset> get assets => _assets;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get summary => _summary;

  double get totalValueInr => _assets.fold(0, (sum, asset) => sum + asset.valueInInr);

  Future<void> loadAssets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await _apiService.getAssets();
      _assets = data.map<Asset>((json) => Asset.fromJson(json)).toList();
      
      // Load summary
      _summary = await _apiService.getAssetSummary();
    } catch (e) {
      _error = 'Failed to load assets';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createAsset(Asset asset) async {
    try {
      await _apiService.createAsset(asset.toJson());
      await loadAssets();
      return true;
    } catch (e) {
      _error = 'Failed to create asset';
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateAsset(int id, Map<String, dynamic> data) async {
    try {
      await _apiService.updateAsset(id, data);
      await loadAssets();
      return true;
    } catch (e) {
      _error = 'Failed to update asset';
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteAsset(int id) async {
    try {
      await _apiService.deleteAsset(id);
      await loadAssets();
      return true;
    } catch (e) {
      _error = 'Failed to delete asset';
      notifyListeners();
      return false;
    }
  }

  List<Asset> getAssetsByType(String type) {
    return _assets.where((asset) => asset.type == type).toList();
  }

  List<Asset> getBankAccounts() {
    return _assets.where((asset) => asset.isBankAccount).toList();
  }

  Map<String, List<Asset>> get assetsByType {
    final Map<String, List<Asset>> grouped = {};
    for (final asset in _assets) {
      if (!grouped.containsKey(asset.type)) {
        grouped[asset.type] = [];
      }
      grouped[asset.type]!.add(asset);
    }
    return grouped;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}