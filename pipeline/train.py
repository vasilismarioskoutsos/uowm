import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from scipy.sparse import load_npz
from torch.utils.data import Dataset, DataLoader
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from model.graph import make_adj_from_interaction, symmetric_normalize_coo
from model.model import LightGCN

class EdgeDataset(Dataset):
    def __init__(self, coo):
        self.users = coo.row
        self.items = coo.col
        self.ratings = coo.data

    def __len__(self):
        return len(self.ratings)

    def __getitem__(self, idx):
        u = torch.tensor(self.users[idx],   dtype=torch.long)
        i = torch.tensor(self.items[idx],   dtype=torch.long)
        r = torch.tensor(self.ratings[idx], dtype=torch.float32)
        return u, i, r

def main():
    # Load training interaction matrix
    train_coo = load_npz("dataset/processed/train_matrix.npz").tocoo()
    num_users, num_movies = train_coo.shape

    # Build torch sparse tensor for the graph
    indices = torch.tensor([train_coo.row, train_coo.col], dtype=torch.int64)
    values = torch.tensor(train_coo.data, dtype=torch.float32)
    r_mat = torch.sparse_coo_tensor(indices, values, train_coo.shape)

    # Build normalized adjacency
    adj = make_adj_from_interaction(r_mat)
    adj = symmetric_normalize_coo(adj)

    # Hyperparameters
    hidden_dim = 3
    embedding_dim = 64
    lr = 1e-3
    epochs = 100
    batch_size = 128

    # Initialize model and optimizer
    model = LightGCN(num_users, hidden_dim, embedding_dim, num_movies, adj, r_mat)
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # Prepare DataLoader
    dataset = EdgeDataset(train_coo)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Training loop
    for epoch in range(1, epochs+1):
        model.train()
        total_loss = 0.0
        for u, i, r in loader:
            optimizer.zero_grad()
            user_emb, movie_emb = model.forward()
            pred = model.predict(u, i, user_emb, movie_emb)
            loss = nn.MSELoss()(pred, r.unsqueeze(1))
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        print(f"Epoch {epoch}/{epochs}, Loss: {total_loss/len(loader):.4f}")

    # Save final model
    os.makedirs("run", exist_ok=True)
    torch.save(model.state_dict(), "run/lightgcn_final.pth")
    print("Training complete")

if __name__ == "__main__":
    main()