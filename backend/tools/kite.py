from kiteconnect import KiteConnect
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.DEBUG)

def get_price(symbol, access_token):
    api_key = os.getenv("API_KEY")
    if not api_key:
        raise ValueError("API_KEY not found in environment variables")
    
    kite = KiteConnect(api_key=api_key)
    kite.set_access_token(access_token)
    
    # Auto prefix NSE:
    code = f"NSE:{symbol.upper()}"
    
    try:
        ltp_data = kite.ltp([code])
        ltp = ltp_data[code]['last_price']
        print(f"LTP for {code}:", ltp)
        return ltp
    except Exception as e:
        print(f"Error fetching price for {code}: {e}")
        raise e