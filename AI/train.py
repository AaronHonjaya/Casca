import argparse
import os

import numpy as np
from dataloader import BankStatementsDataset
from model import Transformer
import torch
import torch.nn.functional as F


def train(args, model, train_loader, val_loader, device):
    model.train()
    model.to(device)   
    criterion = torch.nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    best_val_mse = float("inf")
    val_mse = []
    
    if not os.path.exists(args.savedir):
        os.makedirs(args.savedir)
    if not os.path.exists(os.path.join(args.savedir, "checkpoints")):
        os.makedirs(os.path.join(args.savedir, "checkpoints"))
    
    for epoch in range(args.num_epochs):
        for data, mask, _ in train_loader:
            data = data.to(device)
            mask = mask.to(device)
            optimizer.zero_grad()
            
            
            output = model(data, mask)
            
            masked_data = data[mask]
            masked_output = output[mask]
            
            
            loss = criterion(masked_output, masked_data)
            loss.backward()
            optimizer.step()
        
        with torch.no_grad():
            total_mse = 0
            for data, mask, _, _, _ in val_loader:
                
                data = data.to(device)
                mask = mask.to(device)
                
                
                output = model(data, mask)
                
                masked_data = data[mask]
                masked_output = output[mask]
                
                total_mse += F.mse_loss(masked_data, masked_output).item()
            avg_mse = total_mse / len(val_loader) 
            val_mse.append(avg_mse)
            if avg_mse < best_val_mse:
                print(f"New best model found with MSE: {avg_mse}")
                best_val_mse = avg_mse
                torch.save(model.state_dict(), os.path.join(args.savedir, "best_model.pth"))
                
            
            torch.save(model.state_dict(), os.path.join(args.savedir, "checkpoints", f"{epoch}.pth"))
            np.save(os.path.join(args.savedir, "val_mse.npy"), np.array(val_mse))
            print(f"Epoch: {epoch}, Val MSE: {avg_mse}")
                
                

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--num_epochs", type=int, default=1000)
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--savedir", type=str, default="./logs")
    return parser.parse_args()
        

if __name__ == "__main__":
    args = parse_args()
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = Transformer()
    trainset = BankStatementsDataset("data/bank statements 1_T1_monthly_breakdown.csv")    
    dataloader = torch.utils.data.DataLoader(trainset, batch_size=1, shuffle=True)
    
    valset = BankStatementsDataset("data/bank statements 2_T1_monthly_breakdown.csv", isTrain = False)
    val_loader = torch.utils.data.DataLoader(valset, batch_size=1, shuffle=False)
    train(args, model, dataloader, val_loader, device)
    