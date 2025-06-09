from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class ExchangeRate(models.Model):
    from_currency = models.CharField(max_length=10)
    to_currency = models.CharField(max_length=10)
    rate = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['from_currency', 'to_currency']
    
    def __str__(self):
        return f"{self.from_currency} to {self.to_currency}: {self.rate}"

class Investment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    symbol = models.CharField(max_length=50, blank=True, null=True)  # Stock symbol for API calls
    type = models.CharField(max_length=50)
    qty = models.IntegerField(default=1)
    current_value = models.FloatField()
    purchase_value = models.FloatField()
    currency = models.CharField(max_length=10, default='INR')
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)

class Income(models.Model):
    INCOME_CATEGORIES = [
        ('salary', 'Salary'),
        ('freelance', 'Freelance'),
        ('business', 'Business'),
        ('investment', 'Investment Returns'),
        ('rental', 'Rental Income'),
        ('dividend', 'Dividend'),
        ('interest', 'Interest'),
        ('bonus', 'Bonus'),
        ('commission', 'Commission'),
        ('pension', 'Pension'),
        ('gift', 'Gift'),
        ('other', 'Other'),
    ]
    
    RECURRING_PERIODS = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee (₹)'),
        ('QAR', 'Qatari Riyal (ر.ق)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    source = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=INCOME_CATEGORIES, default='other')
    amount = models.FloatField()
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='INR')
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    recurring_period = models.CharField(max_length=20, choices=RECURRING_PERIODS, null=True, blank=True)
    next_occurrence = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def get_amount_in_inr(self):
        """Convert amount to INR using exchange rate"""
        if self.currency == 'INR':
            return self.amount
        try:
            exchange_rate = ExchangeRate.objects.get(from_currency=self.currency, to_currency='INR')
            return self.amount * exchange_rate.rate
        except ExchangeRate.DoesNotExist:
            return self.amount  # Return original if no exchange rate found

class Budget(models.Model):
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee (₹)'),
        ('QAR', 'Qatari Riyal (ر.ق)'),
    ]
    
    BUDGET_PERIODS = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=50)
    allocated_amount = models.FloatField()
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='QAR')
    period = models.CharField(max_length=20, choices=BUDGET_PERIODS, default='monthly')
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'category', 'period', 'start_date']
    
    def __str__(self):
        return f"{self.category} - {self.allocated_amount} {self.currency} ({self.period})"
    
    def get_allocated_amount_in_inr(self):
        """Convert allocated amount to INR using exchange rate"""
        if self.currency == 'INR':
            return self.allocated_amount
        try:
            exchange_rate = ExchangeRate.objects.get(from_currency=self.currency, to_currency='INR')
            return self.allocated_amount * exchange_rate.rate
        except ExchangeRate.DoesNotExist:
            return self.allocated_amount
    
    def get_spent_amount(self):
        """Get total spent amount for this budget period"""
        expenses = Expense.objects.filter(
            user=self.user,
            category=self.category.lower().replace(' ', '_'),
            date__gte=self.start_date,
            date__lte=self.end_date
        )
        return sum(expense.get_amount_in_inr() for expense in expenses)
    
    def get_remaining_amount(self):
        """Get remaining budget amount in INR"""
        return self.get_allocated_amount_in_inr() - self.get_spent_amount()
    
    def get_utilization_percentage(self):
        """Get budget utilization percentage"""
        allocated = self.get_allocated_amount_in_inr()
        if allocated == 0:
            return 0
        spent = self.get_spent_amount()
        return (spent / allocated) * 100

class Expense(models.Model):
    EXPENSE_CATEGORIES = [
        ('food_and_groceries', 'Food and Groceries'),
        ('internet', 'Internet'),
        ('mobile', 'Mobile'),
        ('residency_renewal', 'Residency Renewal'),
        ('car_petrol', 'Car - Petrol'),
        ('medical', 'Medical'),
        ('car_insurance_maintenance', 'Car - Insurance+Maintenance'),
        ('tickets', 'Tickets'),
        ('school', 'School'),
        ('electronics_items', 'Electronics Items'),
        ('misc', 'Misc'),
        ('madrasa', 'Madrasa'),
        ('rent_we', 'Rent+WE'),
        ('clothes', 'Clothes'),
        ('transport', 'Transportation'),
        ('shopping', 'Shopping'),
        ('entertainment', 'Entertainment'),
        ('bills', 'Bills & Utilities'),
        ('healthcare', 'Healthcare'),
        ('education', 'Education'),
        ('travel', 'Travel'),
        ('investment', 'Investment'),
        ('insurance', 'Insurance'),
        ('rent', 'Rent'),
        ('groceries', 'Groceries'),
        ('fuel', 'Fuel'),
        ('other', 'Other'),
    ]
    
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee (₹)'),
        ('QAR', 'Qatari Riyal (ر.ق)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.FloatField()
    category = models.CharField(max_length=50, choices=EXPENSE_CATEGORIES, default='other')
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='QAR')
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def get_amount_in_inr(self):
        """Convert amount to INR using exchange rate"""
        if self.currency == 'INR':
            return self.amount
        try:
            exchange_rate = ExchangeRate.objects.get(from_currency=self.currency, to_currency='INR')
            return self.amount * exchange_rate.rate
        except ExchangeRate.DoesNotExist:
            return self.amount  # Return original if no exchange rate found
    
    def get_budget_for_category(self):
        """Get active budget for this expense category"""
        try:
            return Budget.objects.get(
                user=self.user,
                category=self.get_category_display(),
                is_active=True,
                start_date__lte=self.date,
                end_date__gte=self.date
            )
        except Budget.DoesNotExist:
            return None

class Asset(models.Model):
    ASSET_TYPES = [
        ('property', 'Real Estate'),
        ('vehicle', 'Vehicle'),
        ('jewelry', 'Jewelry'),
        ('electronics', 'Electronics'),
        ('furniture', 'Furniture'),
        ('art', 'Art & Collectibles'),
        ('equipment', 'Equipment'),
        ('other', 'Other'),
    ]
    
    CURRENCY_CHOICES = [
        ('INR', 'Indian Rupee (₹)'),
        ('QAR', 'Qatari Riyal (ر.ق)'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=ASSET_TYPES, default='other')
    value = models.FloatField()
    currency = models.CharField(max_length=10, choices=CURRENCY_CHOICES, default='INR')
    purchase_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    def get_value_in_inr(self):
        """Convert value to INR using exchange rate"""
        if self.currency == 'INR':
            return self.value
        try:
            exchange_rate = ExchangeRate.objects.get(from_currency=self.currency, to_currency='INR')
            return self.value * exchange_rate.rate
        except ExchangeRate.DoesNotExist:
            return self.value  # Return original if no exchange rate found