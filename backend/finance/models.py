from django.db import models
from django.contrib.auth.models import User

class Investment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    current_value = models.FloatField()
    purchase_value = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

class Income(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    source = models.CharField(max_length=255)
    amount = models.FloatField()
    currency = models.CharField(max_length=10, default='INR')
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    recurring_period = models.CharField(max_length=10, null=True, blank=True)
    notes = models.TextField(blank=True)

class Expense(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.FloatField()
    category = models.CharField(max_length=50)
    currency = models.CharField(max_length=10, default='INR')
    date = models.DateField()
    notes = models.TextField(blank=True)

class Asset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
    value = models.FloatField()
    currency = models.CharField(max_length=10, default='INR')
    notes = models.TextField(blank=True)
