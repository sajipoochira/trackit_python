from rest_framework import serializers
from .models import Investment, Income, Expense, Asset

class InvestmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Investment
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class IncomeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ['user']

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = '__all__'


class LTPResponseSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    ltp = serializers.FloatField()
