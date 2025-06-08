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
import logging

# Load environment variables
load_dotenv()

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
            logger.error(f"Error getting LTP for {symbol}: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class KiteLoginURL(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        
        api_key = os.getenv("API_KEY")
        print("APIKey Loaded:  {api_key}")
        
        logger.debug(f"API_KEY from environment: {api_key}")
        
        if not api_key:
            logger.error("API_KEY not found in environment variables")
            return Response({
                'error': 'Kite API key not configured. Please set API_KEY in environment variables.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            kite = KiteConnect(api_key=api_key)
            login_url = kite.login_url()
            logger.debug(f"Generated login URL: {login_url}")
            return Response({'login_url': login_url})
        except Exception as e:
            logger.error(f"Error generating Kite login URL: {str(e)}")
            return Response({'error': f'Failed to generate login URL: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class KiteCallback(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        request_token = request.data.get('request_token')
        if not request_token:
            return Response({'error': 'Missing request_token'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Load environment variables explicitly
        
        api_key = os.getenv("API_KEY")
        api_secret = os.getenv("API_SEC")
        
        logger.debug(f"API_KEY: {api_key}")
        logger.debug(f"API_SECRET: {'*' * len(api_secret) if api_secret else None}")
        
        if not api_key or not api_secret:
            logger.error("Kite API credentials not found in environment variables")
            return Response({
                'error': 'Kite API credentials not configured. Please set API_KEY and API_SECRET in environment variables.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        try:
            kite = KiteConnect(api_key=api_key)
            data = kite.generate_session(request_token, api_secret=api_secret)
            access_token = data["access_token"]
            
            logger.debug(f"Successfully generated access token for user: {data.get('user_id')}")
            
            return Response({
                'access_token': access_token,
                'user_id': data.get('user_id'),
                'user_name': data.get('user_name')
            })
        except Exception as e:
            logger.error(f"Error in Kite callback: {str(e)}")
            return Response({'error': f'Authentication failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)