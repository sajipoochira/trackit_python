from rest_framework import viewsets, permissions, status
from .models import Investment, Income, Expense, Asset, ExchangeRate, Budget
from .serializers import (
    InvestmentSerializer, IncomeSerializer, ExpenseSerializer, 
    AssetSerializer, ExchangeRateSerializer, LTPResponseSerializer, BudgetSerializer
)
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from nsetools import Nse
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InvestmentViewSet(BaseViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer
    
    def update(self, request, *args, **kwargs):
        # Enable partial updates by default
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        # Ensure partial updates are handled properly
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

class IncomeViewSet(BaseViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    
    def perform_create(self, serializer):
        income = serializer.save(user=self.request.user)
        
        # Calculate next occurrence for recurring income
        if income.is_recurring and income.recurring_period:
            next_date = self.calculate_next_occurrence(income.date, income.recurring_period)
            income.next_occurrence = next_date
            income.save()
    
    def calculate_next_occurrence(self, start_date, period):
        """Calculate the next occurrence date based on the recurring period"""
        if period == 'weekly':
            return start_date + timedelta(weeks=1)
        elif period == 'monthly':
            return start_date + relativedelta(months=1)
        elif period == 'quarterly':
            return start_date + relativedelta(months=3)
        elif period == 'yearly':
            return start_date + relativedelta(years=1)
        return start_date
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all income categories"""
        return Response(Income.INCOME_CATEGORIES)
    
    @action(detail=False, methods=['get'])
    def recurring_periods(self, request):
        """Get all recurring periods"""
        return Response(Income.RECURRING_PERIODS)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get income summary by category and currency"""
        incomes = self.get_queryset()
        
        # Summary by category
        category_summary = {}
        for income in incomes:
            category = income.get_category_display()
            if category not in category_summary:
                category_summary[category] = {
                    'total_amount': 0,
                    'total_amount_inr': 0,
                    'count': 0,
                    'currencies': {}
                }
            
            category_summary[category]['total_amount'] += income.amount
            category_summary[category]['total_amount_inr'] += income.get_amount_in_inr()
            category_summary[category]['count'] += 1
            
            if income.currency not in category_summary[category]['currencies']:
                category_summary[category]['currencies'][income.currency] = 0
            category_summary[category]['currencies'][income.currency] += income.amount
        
        # Summary by currency
        currency_summary = {}
        for income in incomes:
            if income.currency not in currency_summary:
                currency_summary[income.currency] = {
                    'total_amount': 0,
                    'count': 0
                }
            currency_summary[income.currency]['total_amount'] += income.amount
            currency_summary[income.currency]['count'] += 1
        
        return Response({
            'category_summary': category_summary,
            'currency_summary': currency_summary,
            'total_income_inr': sum(income.get_amount_in_inr() for income in incomes),
            'total_count': incomes.count()
        })

class BudgetViewSet(BaseViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        period = self.request.query_params.get('period', None)
        is_active = self.request.query_params.get('is_active', None)
        
        if period:
            queryset = queryset.filter(period=period)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
            
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all budget categories based on expense categories"""
        categories = []
        for code, display in Expense.EXPENSE_CATEGORIES:
            categories.append([display, display])
        return Response(categories)
    
    @action(detail=False, methods=['get'])
    def periods(self, request):
        """Get all budget periods"""
        return Response(Budget.BUDGET_PERIODS)
    
    @action(detail=False, methods=['post'])
    def create_monthly_budget(self, request):
        """Create monthly budget for current month"""
        current_date = date.today()
        start_date = current_date.replace(day=1)
        
        # Calculate end date (last day of current month)
        if current_date.month == 12:
            end_date = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
        
        category = request.data.get('category')
        allocated_amount = request.data.get('allocated_amount')
        currency = request.data.get('currency', 'QAR')
        
        if not category or not allocated_amount:
            return Response(
                {'error': 'category and allocated_amount are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if budget already exists for this category and period
        existing_budget = Budget.objects.filter(
            user=request.user,
            category=category,
            period='monthly',
            start_date=start_date,
            end_date=end_date
        ).first()
        
        if existing_budget:
            return Response(
                {'error': f'Budget for {category} already exists for this month'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        budget = Budget.objects.create(
            user=request.user,
            category=category,
            allocated_amount=float(allocated_amount),
            currency=currency,
            period='monthly',
            start_date=start_date,
            end_date=end_date,
            notes=request.data.get('notes', '')
        )
        
        serializer = BudgetSerializer(budget)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def current_month_summary(self, request):
        """Get budget summary for current month"""
        current_date = date.today()
        start_date = current_date.replace(day=1)
        
        # Calculate end date (last day of current month)
        if current_date.month == 12:
            end_date = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
        
        budgets = Budget.objects.filter(
            user=request.user,
            period='monthly',
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        
        total_allocated = sum(budget.get_allocated_amount_in_inr() for budget in budgets)
        total_spent = sum(budget.get_spent_amount() for budget in budgets)
        total_remaining = total_allocated - total_spent
        
        budget_data = []
        for budget in budgets:
            budget_data.append({
                'id': budget.id,
                'category': budget.category,
                'allocated_amount': budget.allocated_amount,
                'currency': budget.currency,
                'allocated_amount_inr': budget.get_allocated_amount_in_inr(),
                'spent_amount': budget.get_spent_amount(),
                'remaining_amount': budget.get_remaining_amount(),
                'utilization_percentage': budget.get_utilization_percentage()
            })
        
        return Response({
            'period': f"{start_date.strftime('%B %Y')}",
            'start_date': start_date,
            'end_date': end_date,
            'total_allocated_inr': total_allocated,
            'total_spent_inr': total_spent,
            'total_remaining_inr': total_remaining,
            'overall_utilization_percentage': (total_spent / total_allocated * 100) if total_allocated > 0 else 0,
            'budgets': budget_data
        })

class ExpenseViewSet(BaseViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category', None)
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if category:
            queryset = queryset.filter(category=category)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        return queryset.order_by('-date')
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all expense categories"""
        return Response(Expense.EXPENSE_CATEGORIES)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense summary by category and currency"""
        expenses = self.get_queryset()
        
        # Summary by category
        category_summary = {}
        for expense in expenses:
            category = expense.get_category_display()
            if category not in category_summary:
                category_summary[category] = {
                    'total_amount': 0,
                    'total_amount_inr': 0,
                    'count': 0,
                    'currencies': {}
                }
            
            category_summary[category]['total_amount'] += expense.amount
            category_summary[category]['total_amount_inr'] += expense.get_amount_in_inr()
            category_summary[category]['count'] += 1
            
            if expense.currency not in category_summary[category]['currencies']:
                category_summary[category]['currencies'][expense.currency] = 0
            category_summary[category]['currencies'][expense.currency] += expense.amount
        
        return Response({
            'category_summary': category_summary,
            'total_expense_inr': sum(expense.get_amount_in_inr() for expense in expenses),
            'total_count': expenses.count()
        })
    
    @action(detail=False, methods=['get'])
    def budget_analysis(self, request):
        """Get expense analysis against budgets"""
        current_date = date.today()
        start_date = current_date.replace(day=1)
        
        # Calculate end date (last day of current month)
        if current_date.month == 12:
            end_date = current_date.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_date = current_date.replace(month=current_date.month + 1, day=1) - timedelta(days=1)
        
        # Get current month expenses
        expenses = Expense.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )
        
        # Get active budgets
        budgets = Budget.objects.filter(
            user=request.user,
            period='monthly',
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        
        analysis = []
        for budget in budgets:
            category_expenses = expenses.filter(category=budget.category.lower().replace(' ', '_'))
            spent_amount = sum(expense.get_amount_in_inr() for expense in category_expenses)
            
            analysis.append({
                'category': budget.category,
                'allocated_amount': budget.get_allocated_amount_in_inr(),
                'spent_amount': spent_amount,
                'remaining_amount': budget.get_allocated_amount_in_inr() - spent_amount,
                'utilization_percentage': (spent_amount / budget.get_allocated_amount_in_inr() * 100) if budget.get_allocated_amount_in_inr() > 0 else 0,
                'is_over_budget': spent_amount > budget.get_allocated_amount_in_inr(),
                'expense_count': category_expenses.count()
            })
        
        return Response({
            'period': f"{start_date.strftime('%B %Y')}",
            'analysis': analysis
        })

class AssetViewSet(BaseViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get all asset types"""
        return Response(Asset.ASSET_TYPES)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get asset summary by type and currency"""
        assets = self.get_queryset()
        
        # Summary by type
        type_summary = {}
        for asset in assets:
            asset_type = asset.get_type_display()
            if asset_type not in type_summary:
                type_summary[asset_type] = {
                    'total_value': 0,
                    'total_value_inr': 0,
                    'count': 0,
                    'currencies': {}
                }
            
            type_summary[asset_type]['total_value'] += asset.value
            type_summary[asset_type]['total_value_inr'] += asset.get_value_in_inr()
            type_summary[asset_type]['count'] += 1
            
            if asset.currency not in type_summary[asset_type]['currencies']:
                type_summary[asset_type]['currencies'][asset.currency] = 0
            type_summary[asset_type]['currencies'][asset.currency] += asset.value
        
        # Summary by currency
        currency_summary = {}
        for asset in assets:
            if asset.currency not in currency_summary:
                currency_summary[asset.currency] = {
                    'total_value': 0,
                    'count': 0
                }
            currency_summary[asset.currency]['total_value'] += asset.value
            currency_summary[asset.currency]['count'] += 1
        
        return Response({
            'type_summary': type_summary,
            'currency_summary': currency_summary,
            'total_value_inr': sum(asset.get_value_in_inr() for asset in assets),
            'total_count': assets.count()
        })

class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def current_rates(self, request):
        """Get current exchange rates"""
        rates = {}
        for rate in ExchangeRate.objects.all():
            key = f"{rate.from_currency}_to_{rate.to_currency}"
            rates[key] = {
                'rate': rate.rate,
                'updated_at': rate.updated_at
            }
        return Response(rates)
    
    @action(detail=False, methods=['post'])
    def update_rate(self, request):
        """Update or create exchange rate"""
        from_currency = request.data.get('from_currency')
        to_currency = request.data.get('to_currency')
        rate = request.data.get('rate')
        
        if not all([from_currency, to_currency, rate]):
            return Response(
                {'error': 'from_currency, to_currency, and rate are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        exchange_rate, created = ExchangeRate.objects.update_or_create(
            from_currency=from_currency,
            to_currency=to_currency,
            defaults={'rate': float(rate)}
        )
        
        serializer = ExchangeRateSerializer(exchange_rate)
        return Response({
            'exchange_rate': serializer.data,
            'created': created
        })

class LTPViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def get_price(self, request):
        symbol = request.query_params.get('symbol')
        if not symbol:
            return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            logger.debug(f"Fetching price for symbol: {symbol}")
            nse = Nse()
            
            # Try to get quote for the symbol
            stock_data = nse.get_quote(symbol.upper())
            
            if not stock_data:
                return Response({'error': f'Stock data not found for symbol: {symbol}'}, status=status.HTTP_404_NOT_FOUND)
            
            ltp = stock_data.get('lastPrice')
            print("LTP fro the Stock {symbol} : {ltp}")
            if ltp is None:
                return Response({'error': f'Last price not available for symbol: {symbol}'}, status=status.HTTP_404_NOT_FOUND)
            
            logger.debug(f"Successfully fetched LTP for {symbol}: {ltp}")
            return Response({'symbol': symbol, 'ltp': ltp}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return Response({'error': f'Failed to fetch price for {symbol}: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)