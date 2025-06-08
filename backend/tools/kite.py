from kiteconnect import KiteConnect
import os
import logging
logging.basicConfig(level=logging.DEBUG)



def get_price(symbol , Access_token):

    kite.set_access_token(Access_token)
    
  

    
    # Auto prefix NSE:
    code = f"NSE:{symbol.upper()}"

    ltp_data = kite.ltp([code])
    ltp = ltp_data[code]['last_price']
    print(f"LTP for {code}:", ltp)
    return ltp


