from rest_framework import viewsets, permissions
from .models import Investment, Income, Expense, Asset
from .serializers import InvestmentSerializer, IncomeSerializer, ExpenseSerializer, AssetSerializer, LTPResponseSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from nsetools import Nse
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

class IncomeViewSet(BaseViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer

class ExpenseViewSet(BaseViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

class AssetViewSet(BaseViewSet):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

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
            if ltp is None:
                return Response({'error': f'Last price not available for symbol: {symbol}'}, status=status.HTTP_404_NOT_FOUND)
            
            logger.debug(f"Successfully fetched LTP for {symbol}: {ltp}")
            return Response({'symbol': symbol, 'ltp': ltp}, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching price for {symbol}: {str(e)}")
            return Response({'error': f'Failed to fetch price for {symbol}: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)