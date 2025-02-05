
import json
import time
import boto3
import sys
import os
import pdfplumber
import requests
import re
from textract_pdf import get_id_block_mappings, analyze_doc, results_to_csv
from currency_utils import CurrencyUtil, request_exchange_rate



def pdf_to_text(pdf_file_path):
    text = ""
    with pdfplumber.open(pdf_file_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()

            for word in words:
                text += word['text']  # Print each extracted word
                text += " "
    # with open("logs/text.txt", "w") as f:
    #     f.write(text)
    return text



    

if __name__ == "__main__":
    

   
    
    file_to_currency = {}
    for i, pdf in enumerate(sys.argv[1:]):
       
        pdf_file_path = pdf
        file_name = os.path.basename(pdf_file_path).split(".")[0]
    
        comprehend = boto3.client('comprehend')
        
        currencyUtil = CurrencyUtil()

        base_currency = currencyUtil.detect_currency(pdf_to_text(pdf_file_path))
        # print(f"Base currency: {base_currency}")
        file_to_currency[file_name] = base_currency
        
        
            
        textract = boto3.client('textract')
        s3 = boto3.client('s3')
        
        results = analyze_doc(s3, textract, pdf_file_path, file_name)
        id_to_block = get_id_block_mappings(results)
        results_to_csv(results, id_to_block, currencyUtil, file_name)
    
    print(json.dumps(file_to_currency))
    sys.stdout.flush()




