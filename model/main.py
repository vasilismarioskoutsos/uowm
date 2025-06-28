import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from graph import make_coo_tensor, make_adj_from_interaction, symmetric_normalize_coo
from model import LightGCN
import torch.optim as optim
from train_loader import TrainDataset
from torch.utils.data import DataLoader
from torch.optim.lr_scheduler import StepLR 
from eval import evaluate_model
import time
import os

ratings_file = pd.read_csv("dataset\\processed\\processed_ratings.csv")
movies_file = pd.read_csv("dataset\\processed\\processed_movies.csv")

mask = np.random.rand(len(ratings_file)) < 0.8
train_ratings = ratings_file[mask]
test_ratings = ratings_file[~mask]

num_users = train_ratings['userId'].nunique()
total_movies = movies_file['movieId'].nunique()

hidden_dim = 3
embedding_dim = 64
lamda = 1e-6 # for bpr loss
learning_rate = 1e-3

r_mat = make_coo_tensor(num_users, total_movies, train_ratings) # interaction matrix
adj_mat = make_adj_from_interaction(r_mat)
# normalise adj
adj_mat = symmetric_normalize_coo(adj_mat)
print(adj_mat)

model = LightGCN(num_users, hidden_dim, embedding_dim, total_movies, adj_mat, r_mat)
optimizer = optim.Adam(model.parameters(), lr=learning_rate)
scheduler = StepLR(optimizer, step_size=10, gamma=0.5)  

epoch_num = 500

train_dataset = TrainDataset(train_ratings)
train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True, num_workers=0)

run_num = 6
epoch_time = []
for epoch in range(epoch_num):
    start_epoch = time.time()
    model.train()  
    epoch_loss = 0.0
    
    batch_time = []
    epoch_losses = []
    for batch in train_loader:  

        start_batch = time.time()
        #users, pos_movies, neg_movies = batch # get indices for bpr
        
        users, movies, rating = batch
        user_emb, movie_emb = model.forward()
        predicted_rating = model.predict(users, movies, user_emb, movie_emb)
        # loss = model.bpr_loss(user_emb[users], movie_emb[pos_movies], movie_emb[neg_movies], lamda) 
        criterion = nn.MSELoss()
        loss = criterion(predicted_rating, rating.float().unsqueeze(1))
 
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        
        epoch_loss += loss.item()
        print("User Emb Norm:", model.user_emb.weight.norm().item())
        print("Item Emb Norm:", model.movie_emb.weight.norm().item())
        print("Rating:", predicted_rating)
        print(epoch_loss)

        epoch_losses.append(epoch_loss)

        end_batch = time.time()
        batch_time.append(start_batch - end_batch)
    
    scheduler.step()  
    
    print(f"Epoch {epoch+1}/{epoch_num}, Loss: {epoch_loss/len(train_loader)}")
    
    # save checkpoints
    os.makedirs(f"run_{run_num}", exist_ok=True)

    if (epoch + 1) % 10 == 0:
        path = os.path.join(f"run_{run_num}", f"lightgcn_epoch_{epoch+1}.pth")
        torch.save(model.state_dict(), path)

    end_epoch = time.time()
    epoch_time.append(start_epoch - end_epoch)

print(f"Average epoch time: {sum(epoch_time) / len(epoch_time)}")
print(f"Average batch time: {sum(batch_time) / len(batch_time)}")
# test epoch
current_epoch = 10 
ndcg_all = []
precision_all = []
recall_all = []
for epoch in range(epoch_num/10):
    path = f"run_{run_num}\\lightgcn_epoch_{current_epoch}.pth"
    current_epoch += 10
    model.load_state_dict(torch.load(path))
    ndcg, precision, recall = evaluate_model(model, test_ratings, num_users, min_rating=0.5, K=10)

    data = (ndcg, epoch)
    ndcg_all.append(data)
    precision_all.append(precision)
    recall_all.append(recall)

ndcg_all.sort(key=lambda x: x[0], reverse=True)
for ndcg, epoch in ndcg_all:
    print(f"NDCG@10: {ndcg:.4f} at Epoch: {epoch}")
#print(f"Precision@10: {precision:.4f}")
#print(f"Recall@10: {recall:.4f}")