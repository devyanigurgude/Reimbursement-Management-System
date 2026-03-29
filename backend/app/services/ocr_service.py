import google.generativeai as genai
import base64
import json
import re
from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def extract_receipt_data(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        image_part = {
            "inline_data": {
                "mime_type": mime_type,
                "data": base64.b64encode(image_bytes).decode("utf-8")
            }
        }
        prompt = """Analyze this receipt image and extract information.
Return ONLY a valid JSON object with these exact keys:
{
  "title": "short expense title",
  "vendor_name": "name of shop/restaurant/vendor",
  "amount": 0.00,
  "currency_code": "USD",
  "category": "Food",
  "expense_date": "YYYY-MM-DD",
  "description": "brief description of what was purchased"
}
For category use one of: Food, Travel, Accommodation, Office Supplies, Medical, Entertainment, Other.
If currency is unclear use USD. If date is unclear use today's date.
Return ONLY the JSON, no extra text."""

        response = model.generate_content([prompt, image_part])
        text = response.text.strip()
        text = re.sub(r"```json|```", "", text).strip()
        return json.loads(text)
    except Exception as e:
        return {
            "title": "Scanned Expense",
            "vendor_name": "",
            "amount": 0.0,
            "currency_code": "USD",
            "category": "Other",
            "expense_date": "",
            "description": f"OCR extraction failed: {str(e)}"
        }
