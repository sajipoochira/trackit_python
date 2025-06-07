from kiteconnect import KiteConnect
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

api_key = os.getenv("API_KEY")
access_token = os.getenv("ACCESS_TOKEN")

def get_price(symbol):
    kite = KiteConnect(api_key=api_key)
    kite.set_access_token(access_token)

    # Auto prefix NSE:
    code = f"NSE:{symbol.upper()}"

    ltp_data = kite.ltp([code])
    ltp = ltp_data[code]['last_price']
    print(f"LTP for {code}:", ltp)
    return ltp


