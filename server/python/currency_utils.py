

import re
import requests
import boto3
# this is for testing only. 
API_KEY = "da7458d8e8933d0c1c9f40f2"
def request_exchange_rate():
    
    url = f"https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD"
    response = requests.get(url)
    data = response.json()
    return data["conversion_rates"]


class CurrencyUtil:
    def __init__(self):
        self.comprehend = boto3.client('comprehend')
        
        self.symbol_code_mapping = {
            "$": "USD",      # US Dollar
            "€": "EUR",      # Euro
            "£": "GBP",      # British Pound
            "¥": "JPY",      # Japanese Yen
            "₹": "INR",      # Indian Rupee
            "₩": "KRW",      # South Korean Won
            "₽": "RUB",      # Russian Ruble
            "₱": "PHP",      # Philippine Peso
            "₮": "MNT",      # Mongolian Tögrög
            "₦": "NGN",      # Nigerian Naira
            "₴": "UAH",      # Ukrainian Hryvnia
            "฿": "THB",      # Thai Baht
            "₲": "PYG",      # Paraguayan Guaraní
            "₪": "ILS",      # Israeli Shekel
            "₡": "CRC",      # Costa Rican Colón
            "₵": "GHS",      # Ghanaian Cedi
            "₭": "LAK",      # Lao Kip
            "₤": "ITL",      # Italian Lira (Obsolete)
            "₳": "ARA",      # Argentine Austral (Obsolete)
            "₸": "KZT",      # Kazakhstani Tenge
            "₯": "GRD",      # Greek Drachma (Obsolete)
            "₠": "XEU",      # European Currency Unit (Obsolete)
            "₧": "ESP",      # Spanish Peseta (Obsolete)
            "₷": "MKN",      # Macedonian Denar (Old Symbol)
            "₺": "TRY",      # Turkish Lira
            "₼": "AZN",      # Azerbaijani Manat
            "₾": "GEL",      # Georgian Lari
            "៛": "KHR",      # Cambodian Riel
            "ƒ": "ANG",      # Netherlands Antillean Guilder
            "₰": "PF",       # German Pfennig (Obsolete)
            "¤": "XDR",      # Special Drawing Rights
            "ден": "MKD",    # Macedonian Denar
            "лв": "BGN",     # Bulgarian Lev
            "сом": "KGS",    # Kyrgyzstani Som
            "ман": "AZN",    # Azerbaijani Manat (Alternative Symbol)
            "сом": "KGS",    # Kyrgyzstani Som
            "руб": "RUB",    # Russian Ruble (Cyrillic)
            "د.إ": "AED",    # United Arab Emirates Dirham
            "د.ك": "KWD",    # Kuwaiti Dinar
            "د.ب": "BHD",    # Bahraini Dinar
            "د.ع": "IQD",    # Iraqi Dinar
            "د.ل": "LYD",    # Libyan Dinar
            "د.م.": "MAD",   # Moroccan Dirham
            "د.ت": "TND",    # Tunisian Dinar
            "ر.س": "SAR",    # Saudi Riyal
            "ر.ع.": "OMR",   # Omani Rial
            "৳": "BDT",     # Bangladeshi Taka
            "₵": "GHS",     # Ghanaian Cedi
            "円": "JPY",     # Japanese Yen (Kanji)
            "元": "CNY",     # Chinese Yuan (Character)
            "圓": "TWD",     # Taiwan Dollar (Traditional Character)
            "₨": "PKR",     # Pakistani Rupee
            "৲": "BDT",     # Bangladeshi Taka (Alternate)
            "रु": "NPR",     # Nepalese Rupee
            "૱": "INR",      # Gujarati Rupee
            "௹": "INR",      # Tamil Rupee
            "रू": "NPR",     # Nepalese Rupee (Alternate)
            "₮": "MNT",      # Mongolian Tögrög
            "₰": "PF",       # German Pfennig (Obsolete)
            "₳": "ARA",      # Argentine Austral (Obsolete)
            "₺": "TRY",      # Turkish Lira
            "₼": "AZN",      # Azerbaijani Manat
            "₾": "GEL",      # Georgian Lari
        }
        
    def get_symbols(self):
        return self.symbol_code_mapping.keys()
    
    def get_codes(self):
        return self.symbol_code_mapping.values()
    
    
    def detect_currency_with_aws(self, text):
        # Use AWS Comprehend for entity detection
        response = self.comprehend.detect_entities(Text=text, LanguageCode="en")

        # Check if any monetary values (QUANTITY entities) contain a currency
        for entity in response["Entities"]:
            if entity["Type"] == "QUANTITY" and "Currency" in entity["Text"]:
                return entity["Text"]  # Example: "USD", "GBP", "EUR"

        return None


    def detect_currency_with_regex(self, text):
        # Check for currency symbols (ensure they are standalone)
        symbol_highest_matches = 0
        best_symbol = None
        for symbol in self.symbol_code_mapping.keys():
            matches = re.findall(rf"\{symbol}(\s|\d|$)", text)  # Find all occurrences of symbol followed by space, digit, or end of string
            if len(matches) > symbol_highest_matches:
                symbol_highest_matches = len(matches)
                best_symbol = symbol
    

        # Check for currency codes with word boundaries
        code_highest_matches = 0
        best_code = None
        for code in self.symbol_code_mapping.values():
            pattern = rf"(?<=[0-9: ]){code}(?=[0-9 ]|$)"  # Lookbehind for digit, colon, or space, followed by code, followed by digit or space
            matches = re.findall(pattern, text)  # Find all occurrences of symbol followed by space, digit, or end of string
            

                
            if len(matches) > code_highest_matches:
                code_highest_matches = len(matches)
                best_code = code
        
        
        
        if code_highest_matches > symbol_highest_matches:
            return best_code
        elif symbol_highest_matches > 0:
            return self.symbol_code_mapping[best_symbol]
        else:
            return None

    def detect_currency(self, text):
        regex_currency = self.detect_currency_with_regex(text)
        aws_currency = self.detect_currency_with_aws(text)
        
        currency_code = None
        if aws_currency is None and regex_currency is None:
            currency_code = "USD"
        elif aws_currency is not None:
            currency_code = aws_currency
        else:
            currency_code = regex_currency
        
        return currency_code
