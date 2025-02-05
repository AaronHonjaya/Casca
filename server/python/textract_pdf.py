import json
import os
import pandas as pd 
import time
from currency_utils import CurrencyUtil

BUCKET_NAME = "casca-pdfs"


def analyze_doc(s3, textract, pdf_file_path, file_name):
    if os.path.exists(os.path.join("jsons/", f"{file_name}.json")):
        return json.load(open(os.path.join("jsons/", f"{file_name}.json")))
    # Upload PDF to S3
    s3.upload_file(pdf_file_path, BUCKET_NAME, file_name)

    # Start document text detection in Textract
    json_response = textract.start_document_analysis(
        DocumentLocation={'S3Object': {'Bucket': BUCKET_NAME, 'Name': file_name}},
        FeatureTypes=["TABLES"]
    )
    
    # Wait for job to finish
    while True:
        analyze_results = textract.get_document_analysis(JobId=json_response["JobId"])
        status = analyze_results["JobStatus"]
        
        if status in ["SUCCEEDED", "FAILED"]:
            break # Return response when job is done
        
        time.sleep(5)  


    # Fetch full results using pagination
    all_blocks = {"Blocks": []}
    while True:
        all_blocks["Blocks"].extend(analyze_results["Blocks"])
        
        if "NextToken" in analyze_results:
            analyze_results = textract.get_document_analysis(JobId=json_response["JobId"], NextToken=analyze_results["NextToken"])
        else:
            break
    
    with open(os.path.join("jsons/", f"{file_name}.json"), "w") as f:
        json.dump(all_blocks, f, indent=4)
    # return all blocks
    return all_blocks


# Extract text from a block
def get_block_text(block, id_to_block, currencyUtil: CurrencyUtil , currency_seps = ".,"):
    header_text = []
    if "Relationships" not in block:
        return ""
    
    for relation in block["Relationships"]:
        for child_id in relation["Ids"]:
                cur_block = id_to_block[child_id]
                text = ""
                if "Text" in cur_block:
                    text = cur_block["Text"].strip()
                elif "SelectionStatus" in cur_block:
                    text = cur_block["SelectionStatus"].strip()
                header_text.append(text)
    text = " ".join(header_text).strip()
    
    number_str = get_number_str(text, currencyUtil.get_symbols(), currency_seps)
    if number_str is not None:
        for c in currency_seps:
            if c == ".":
                continue
        number_str = number_str.replace(c, "")
        
        if "." in currency_seps and number_str.count(".") > 1:
            last_dot_index = number_str.rfind(".")
            number_str = number_str[:last_dot_index].replace(".", "") + number_str[last_dot_index:]
            
        # usd_amount = currencyUtil.convert_currency_to_usd(base_currency, float(number_str))
        return number_str
    else:
        return text
    

# Extract number string from text
def get_number_str(text : str, currency_symbols, valid_seps = ".,"):
    amount_start = -1
    amount_end = -1
    for i, c in enumerate(text):
        if c.isdigit():
            if amount_start == -1:
                amount_start = i
        elif c not in valid_seps and c not in currency_symbols and amount_start != -1:
            if amount_start != -1:
                amount_end = i
                break
    
    if amount_start != -1 and amount_end == -1:
        amount_end = len(text)
        
    # assumes that any number appearing on a bank statement with relevance has half the text as digits. 
    return text[amount_start:amount_end] if amount_start != -1 and amount_end - amount_start > len(text)/2 else None



def get_id_block_mappings(analyze_results):
    # Dictionary to store id to block mappings
    id_to_block = {}

    for block in analyze_results["Blocks"]:
        id = block["Id"]   
        
        id_to_block[id] = block
        
        
                
    return id_to_block


# Convert results to CSV
def results_to_csv(analyze_results, id_to_block, currencyUtil: CurrencyUtil, save_name):
    """_summary_

    Args:
        analyze_results (dict): result returned from analyze_doc
        id_to_block (dict): result returned from get_id_block_mappings
        currencyUtil (CurrencyUtil): currency utility object
        save_name (name to save the csv file as): name to save the csv file as
    """
    
    # Extract tables
    table_headers = []
    table_children = []
    for block in analyze_results["Blocks"]:
        if block["BlockType"] == "TABLE" and "STRUCTURED_TABLE" in block["EntityTypes"]:
            column_header_names = []
            cur_table_children = []
            
            # Iterate through all cells related to the table. 
            for relation in block["Relationships"]:
                
                # skip non-children
                if relation["Type"] != "CHILD":
                    continue
                
                # Iterate through all children inside the table.
                for cell_id in relation["Ids"]:
                    # skip if cell_id is not in id_to_block (e.g. child is not mapped)
                    if cell_id not in id_to_block:
                        continue
                    
                    # Get the block of the child
                    child_block = id_to_block[cell_id]

                    # check if its a header or just data
                    if child_block["BlockType"] == "CELL" and "EntityTypes" in child_block and "COLUMN_HEADER" in child_block["EntityTypes"]:
                        header_name = get_block_text(child_block, id_to_block, currencyUtil)
                        if header_name not in column_header_names:
                            column_header_names.append(header_name)
                    elif child_block["BlockType"] == "CELL":
                        child_text = get_block_text(child_block, id_to_block, currencyUtil)
                        cur_table_children.append(child_text)

            # If there are no column headers, then we assume that the table is a continuation of the previous table
            if len(column_header_names) != 0:
                table_headers.append(column_header_names)
                table_children.append(cur_table_children)
            else:
                table_children[-1].extend(cur_table_children)
            
            
    # Generate Tables
    table_data = []
    for i, children in enumerate(table_children):
        num_columns = len(table_headers[i])
        num_rows = len(children) // num_columns
        
        cur_table_data = [[None for _ in range(num_columns)] for _ in range(num_rows)]
        
        for idx, child_text in enumerate(children):
            
            row = idx // num_columns
            col = idx % num_columns
            
            cur_table_data[row][col] = child_text
                
        table_data.append(cur_table_data)
   

    # aggregate tables with the same headers
    table_df_list = []
    for i in range(len(table_data)):
        table_df = pd.DataFrame(table_data[i], columns=table_headers[i])
        table_df = table_df.drop(columns= [""], errors="ignore")
        index = -1
        for j, prev_table_df in enumerate(table_df_list):
            if prev_table_df.columns.equals(table_df.columns):
                index = j
                break
        
        if index != -1:
            table_df_list[index] = pd.concat([table_df_list[index], table_df])
        else:
            table_df_list.append(table_df)
    
    # Save tables to CSV
    save_dir = f"csv/{save_name}"
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
        
    for i, table_df in enumerate(table_df_list):
        table_df.to_csv(os.path.join(save_dir, f"test_table_{i}.csv"), sep="\t",index=False)
        
    
    
        
            
           
        