import argparse
import json
import os

import numpy as np
from dataloader import BankStatementsDataset
from model import Transformer
import torch
import torch.nn.functional as F


def test(args, model, test_loader, device):
    model.train()
    model.to(device)   
    
    results = {
        "predictions": {},
    }
    with torch.no_grad():
        total_mse = 0
        for idx, (data, mask, log_min, log_max, rows) in enumerate(test_loader):
            print(data)
            masked_month = rows['date'][idx][0]
            data = data.to(device)
            mask = mask.to(device)
            
            output = model(data, mask)
            print(output)
            masked_data = data[mask]
            masked_output = output[mask]
            total_mse += F.mse_loss(masked_data, masked_output).item()
            
            
            masked_output = masked_output.cpu().numpy().squeeze()
            log_min = log_min.item()
            log_max = log_max.item()
            
            print(masked_output.shape)
            
            masked_output[:2] = np.expm1(masked_output[:2] * (log_max - log_min) + log_min)
            masked_output[2:] = masked_output[2:] * 30
            
            
            results["predictions"][masked_month] = list(map(float, masked_output))
            print(masked_output)
            
        avg_mse = total_mse / len(test_loader) 
        print(f"Test MSE: {avg_mse}")
    
        results["mse"] = avg_mse
        
        with open(os.path.join(args.savedir, "results.json"), "w") as f:
            json.dump(results, f, indent=4)
        
                
                

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--num_epochs", type=int, default=1000)
    parser.add_argument("--savedir", type=str, default="./logs")
    return parser.parse_args()
        

if __name__ == "__main__":
    args = parse_args()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = Transformer()
    testset = BankStatementsDataset("data/bank statements 4_T1_monthly_breakdown.csv", isTrain=False)    
    dataloader = torch.utils.data.DataLoader(testset, batch_size=1, shuffle=False)
    
    
    test(args, model, dataloader, device)
    