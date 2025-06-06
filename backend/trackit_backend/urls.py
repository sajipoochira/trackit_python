from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from finance.views import InvestmentViewSet, IncomeViewSet, ExpenseViewSet, AssetViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'investments', InvestmentViewSet)
router.register(r'incomes', IncomeViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'assets', AssetViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),
    path('admin/', admin.site.urls),

]


