from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from finance.views import InvestmentViewSet, IncomeViewSet, ExpenseViewSet, AssetViewSet, LTPViewSet,KiteLoginURL,KiteCallback
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'investments', InvestmentViewSet)
router.register(r'incomes', IncomeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'assets', AssetViewSet)
router.register(r'ltp', LTPViewSet, basename='ltp')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('admin/', admin.site.urls),
    path('api/kite/login-url/', KiteLoginURL.as_view(), name='kite-login-url'),
    path('api/kite/callback/', KiteCallback.as_view(), name='kite-callback'),
]