from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from finance.views import (
    InvestmentViewSet, IncomeViewSet, ExpenseViewSet, 
    AssetViewSet, ExchangeRateViewSet, LTPViewSet, BudgetViewSet, LiabilityViewSet, MoneyLentViewSet
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from users.views import RegisterView, CurrentUserView

router = DefaultRouter()
router.register(r'investments', InvestmentViewSet)
router.register(r'incomes', IncomeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'budgets', BudgetViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'liabilities', LiabilityViewSet)
router.register(r'money-lent', MoneyLentViewSet)
router.register(r'exchange-rates', ExchangeRateViewSet)
router.register(r'ltp', LTPViewSet, basename='ltp')
from finance.views import ReportsViewSet
router.register(r'reports', ReportsViewSet, basename='reports')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('api/auth/register/', RegisterView.as_view()),
    path('api/auth/me/', CurrentUserView.as_view()),
    path('admin/', admin.site.urls),
]

# Optional OpenAPI schema/docs when drf-spectacular is installed
try:
    from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
    ]
except Exception:
    pass
