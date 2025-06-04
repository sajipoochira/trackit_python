from rest_framework import viewsets, permissions
from .models import Investment, Income, Expense, Asset
from .serializers import InvestmentSerializer, IncomeSerializer, ExpenseSerializer, AssetSerializer

class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class InvestmentViewSet(BaseViewSet):
    queryset = Investment.objects.all()
    serializer_class = InvestmentSerializer

class IncomeViewSet(BaseViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer

class ExpenseViewSet(BaseViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class AssetViewSet(BaseViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer