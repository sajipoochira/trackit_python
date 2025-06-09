from rest_framework import serializers
from .models import Investment, Income, Expense, Asset, ExchangeRate

class InvestmentSerializer(serializers.ModelSerializer):
    amount_in_inr = serializers.SerializerMethodField()
    
    class Meta:
        model = Investment
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
    
    def get_amount_in_inr(self, obj):
        """Get current value in INR"""
        if obj.currency == 'INR':
            return obj.current_value * obj.qty
        try:
            exchange_rate = ExchangeRate.objects.get(from_currency=obj.currency, to_currency='INR')
            return (obj.current_value * obj.qty) * exchange_rate.rate
        except ExchangeRate.DoesNotExist:
            return obj.current_value * obj.qty
    
    def update(self, instance, validated_data):
        # Handle partial updates - only update fields that are provided
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class IncomeSerializer(serializers.ModelSerializer):
    amount_in_inr = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    recurring_period_display = serializers.CharField(source='get_recurring_period_display', read_only=True)
    
    class Meta:
        model = Income
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
    
    def get_amount_in_inr(self, obj):
        return obj.get_amount_in_inr()

class ExpenseSerializer(serializers.ModelSerializer):
    amount_in_inr = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
    
    def get_amount_in_inr(self, obj):
        return obj.get_amount_in_inr()

class AssetSerializer(serializers.ModelSerializer):
    value_in_inr = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)
    
    class Meta:
        model = Asset
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
    
    def get_value_in_inr(self, obj):
        return obj.get_value_in_inr()

class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = '__all__'

class LTPResponseSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    ltp = serializers.FloatField()