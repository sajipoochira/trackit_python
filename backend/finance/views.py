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
from django.conf import settings


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

    @action(detail=False, methods=['get'])
    def get_ltp(self, request):
        symbol = request.GET.get('symbol')
        if not symbol:
            return Response({'error': 'Symbol parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ltp = get_price(symbol)
            response_data = {'symbol': symbol.upper(), 'ltp': ltp}
            serializer = LTPResponseSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


kite_access_token = None

class KiteLoginURL(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        kite = KiteConnect(api_key=settings.api_key)
        login_url = kite.login_url()
        return Response({'login_url': login_url})

class KiteCallback(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        request_token = request.query_params.get('request_token')
        if not request_token:
            return Response({'error': 'Missing request_token'}, status=400)
        kite = KiteConnect(api_key=settings.api_key)
        try:
            data = kite.generate_session(request_token, api_secret=settings.api_secret)
            global kite_access_token
            kite_access_token = data["access_token"]
            # Store this token securely for the user/session
            return Response({'access_token': kite_access_token})
        except Exception as e:
            return Response({'error': str(e)}, status=400)