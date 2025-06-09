from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from finance.views import (
    InvestmentViewSet, IncomeViewSet, ExpenseViewSet, 
    AssetViewSet, ExchangeRateViewSet, LTPViewSet, BudgetViewSet, LiabilityViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'investments', InvestmentViewSet)
router.register(r'incomes', IncomeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'liabilities', LiabilityViewSet)
router.register(r'exchange-rates', ExchangeRateViewSet)
router.register(r'ltp', LTPViewSet, basename='ltp')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('admin/', admin.site.urls),
]