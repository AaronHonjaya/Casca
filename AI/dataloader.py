import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset


class BankStatementsDataset(Dataset):
    def __init__(self, csv_path, isTrain = True):
        self.manifest = pd.read_csv(csv_path)
        self.manifest = self.manifest[["date", "total_debit", "total_credit", "num_debit_transactions", "num_credit_transactions"]]
        self.isTrain = isTrain
        
        # if not isinstance(split, tuple) or not len(split) == 2:
        #     raise ValueError("split must be a tuple of two integers")
        
        # print(self.manifest)
        # self.manifest = self.manifest.iloc[split]
        
    def __len__(self):
        return len(self.manifest)

    def __getitem__(self, idx):
        
        data = []
        if self.isTrain:
            idx2 = idx
            while idx2 == idx:
                idx2 = torch.randint(0, len(self.manifest), (1,)).item()
            start = min(idx, idx2)
            end = max(idx, idx2)
        else:
            start = 0
            end = len(self.manifest) - 1
        rows = self.manifest.iloc[start:end+1]
        data = np.array(rows[["total_debit", "total_credit", "num_debit_transactions", "num_credit_transactions"]].values)
        
        data[:, :2] = np.log1p(data[:, :2])
        
        log_min = data[:, :2].min()
        log_max = data[:, :2].max()
        
        
        data[:, :2] = (data[:, :2] - log_min)/ (log_max - log_min)
        data[:, 2:] = data[:, 2:] / 30  # Normalize number of transactions by day
        
        seqlen = data.shape[0]
        mask = np.zeros((seqlen,)).astype(bool)
        if self.isTrain:
            num_to_mask = seqlen // 2  # Always mask half
            masked_indices = np.random.permutation(seqlen)[:num_to_mask]
            mask[masked_indices] = True
            
        else:
            mask[idx] = True
            
        if self.isTrain:
            return torch.tensor(data.astype(np.float32)), torch.tensor(mask.astype(bool)), rows.to_dict()
        else:
            
            return torch.tensor(data.astype(np.float32)), torch.tensor(mask.astype(bool)), log_min, log_max, rows.to_dict()
        
