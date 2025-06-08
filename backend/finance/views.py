from rest_framework import viewsets, permissions
from .models import Investment, Income, Expense, Asset
from .serializers import InvestmentSerializer, IncomeSerializer, ExpenseSerializer, AssetSerializer, LTPResponseSerializer
from tools.kite import get_price
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from kiteconnect import KiteConnect
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def get_ltp(self, request):
        symbol = request.GET.get('symbol')
        access_token = request.GET.get('access_token')
        
        if not symbol:
            return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not access_token:
            return Response({'error': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ltp = get_price(symbol, access_token)
            response_data = {'symbol': symbol.upper(), 'ltp': ltp}
            serializer = LTPResponseSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class KiteLoginURL(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        api_key = os.getenv("API_KEY")
        if not api_key:
            return Response({'error': 'Kite API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        kite = KiteConnect(api_key=api_key)
        login_url = kite.login_url()
        return Response({'login_url': login_url})

class KiteCallback(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        request_token = request.data.get('request_token')
        if not request_token:
            return Response({'error': 'Missing request_token'}, status=status.HTTP_400_BAD_REQUEST)
        
        api_key = os.getenv("API_KEY")
        api_secret = os.getenv("API_SECRET")
        
        if not api_key or not api_secret:
            return Response({'error': 'Kite API credentials not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        kite = KiteConnect(api_key=api_key)
        try:
            data = kite.generate_session(request_token, api_secret=api_secret)
            access_token = data["access_token"]
            return Response({
                'access_token': access_token,
                'user_id': data.get('user_id'),
                'user_name': data.get('user_name')
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)