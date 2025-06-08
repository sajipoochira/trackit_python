from kiteconnect import KiteConnect
import os
from dotenv import load_dotenv
import logging

# Load environment variables


# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def get_price(symbol, access_token):
    # Load environment variables explicitly
    load_dotenv()
    api_key = os.getenv("API_KEY")
    
    logger.debug(f"API_KEY in get_price: {api_key}")
    
    if not api_key:
        raise ValueError("API_KEY not found in environment variables")
    
    if not access_token:
        raise ValueError("Access token is required")
    
    kite = KiteConnect(api_key=api_key)
    kite.set_access_token(access_token)
    
    # Auto prefix NSE:
    code = f"NSE:{symbol.upper()}"
    
    try:
        logger.debug(f"Fetching LTP for: {code}")
        ltp_data = kite.ltp([code])
        ltp = ltp_data[code]['last_price']
        logger.debug(f"LTP for {code}: {ltp}")
        return ltp
    except Exception as e:
        logger.error(f"Error fetching price for {code}: {e}")
        raise e