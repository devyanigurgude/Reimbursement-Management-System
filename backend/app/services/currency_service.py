import requests
from app.core.config import settings

def get_all_countries():
    try:
        resp = requests.get(settings.RESTCOUNTRIES_URL, timeout=10)
        data = resp.json()
        countries = []
        for item in data:
            name = item.get("name", {}).get("common", "")
            currencies = item.get("currencies", {})
            for code, details in currencies.items():
                countries.append({
                    "country": name,
                    "currency_code": code,
                    "currency_name": details.get("name", ""),
                    "currency_symbol": details.get("symbol", "")
                })
        return sorted(countries, key=lambda x: x["country"])
    except Exception as e:
        return []

def convert_currency(amount: float, from_currency: str, to_currency: str) -> float:
    if from_currency == to_currency:
        return amount
    try:
        url = f"{settings.EXCHANGE_RATE_BASE_URL}/{from_currency}"
        resp = requests.get(url, timeout=10)
        data = resp.json()
        rates = data.get("rates", {})
        rate = rates.get(to_currency)
        if not rate:
            return amount
        return round(amount * rate, 2)
    except Exception:
        return amount
