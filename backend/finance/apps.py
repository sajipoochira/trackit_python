from django.apps import AppConfig
from django.conf import settings
import os

_scheduler_started = False

class FinanceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance'

    def ready(self):
        global _scheduler_started
        # Avoid duplicate scheduler on autoreload or multiple workers
        if _scheduler_started or os.environ.get('RUN_MAIN') == 'false':
            return

        try:
            from apscheduler.schedulers.background import BackgroundScheduler
            from apscheduler.triggers.cron import CronTrigger
            from django.utils import timezone
            from .models import Investment
            from .views import logger
            import requests

            scheduler = BackgroundScheduler(timezone=str(timezone.get_current_timezone()))

            def refresh_quotes_job():
                try:
                    symbols = list(
                        Investment.objects.exclude(symbol__isnull=True)
                        .exclude(symbol__exact='')
                        .values_list('symbol', flat=True)
                        .distinct()
                    )
                    if not symbols:
                        return

                    base_url = os.environ.get('INDIANAPI_BASE_URL', 'https://stock.indianapi.in')
                    api_key = os.environ.get('INDIANAPI_KEY')
                    headers = {}
                    if api_key:
                        headers['Authorization'] = f"Bearer {api_key}"
                        headers['x-api-key'] = api_key

                    from .models import StockQuote

                    for sym in symbols:
                        url = f"{base_url}/stock?name={sym}"
                        resp = requests.get(url, headers=headers, timeout=15)
                        if resp.status_code != 200:
                            continue
                        data = resp.json() if resp.content else {}
                        cp = (data or {}).get('currentPrice') or {}
                        StockQuote.objects.update_or_create(
                            symbol=str(sym).upper(),
                            defaults={
                                'company_name': (data or {}).get('companyName'),
                                'bse_price': cp.get('BSE'),
                                'nse_price': cp.get('NSE'),
                            }
                        )
                except Exception as e:
                    logger.error(f"Scheduled refresh_quotes_job failed: {e}")

            # Weekdays (Mon-Fri), hourly 8:00 to 14:00 inclusive
            scheduler.add_job(
                refresh_quotes_job,
                CronTrigger(day_of_week='mon-fri', hour='8-14', minute=0),
                id='refresh_quotes_job', replace_existing=True
            )

            scheduler.start()
            _scheduler_started = True
            logger.info("APScheduler started: refresh_quotes_job scheduled (Mon-Fri 08-14 hourly)")
        except Exception as e:
            # Don't break startup if scheduler fails
            import logging as _logging
            _logging.getLogger(__name__).error(f"Failed to start APScheduler: {e}")
