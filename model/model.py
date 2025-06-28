import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import MessagePassing

class LightGCN(MessagePassing):
    def __init__(self, input_dim, hidden_dim, embedding_dim, output_dim, adj, r_mat, dropout_rate=0.1):
        super(LightGCN, self).__init__()
        self.input_dim = input_dim # total users
        self.output_dim = output_dim # total movies
        self.hidden_dim = hidden_dim # total layers
        self.embedding_dim = embedding_dim
        self.adj = adj.float() # to float32
        self.r_mat = r_mat.float() # interaction matrix
        # make embeddings
        self.user_emb = nn.Embedding(input_dim, embedding_dim, dtype=torch.float32)
        self.movie_emb = nn.Embedding(output_dim, embedding_dim, dtype=torch.float32)
        # init embeddings
        nn.init.normal_(self.user_emb.weight, std=0.1)
        nn.init.normal_(self.movie_emb.weight, std=0.1)

        self.dropout = nn.Dropout(p=dropout_rate)
        # linear layer at the end to output a single value
        self.out = nn.Linear(self.embedding_dim * 2, 1) # concat user and movie embs, output 1 value

    def forward(self):
        all_emb = torch.cat([self.user_emb.weight, self.movie_emb.weight])
        embeddings_list = [all_emb] 
        edge_index = self.adj._indices() 
        edge_weight = self.adj._values()    
        print(embeddings_list)
        for layer in range(self.hidden_dim):
            all_emb = self.propagate(edge_index=edge_index, x=all_emb, norm=edge_weight) # pass the graph data
            embeddings_list.append(all_emb)

        embeddings_list = torch.stack(embeddings_list, dim=1)

        final_embedding = torch.mean(embeddings_list, dim=1)
            
        user_final_embeddings = final_embedding[:self.input_dim]
        movie_final_embeddings = final_embedding[self.input_dim:]

        return user_final_embeddings, movie_final_embeddings
    
    def predict(self, batch_users, batch_movies, user_emb, movie_emb):
        # look up the embeddings for the given batch
        user_batch = user_emb[batch_users]     
        movie_batch = movie_emb[batch_movies]     
        # concatenate the embeddings
        x = torch.cat([user_batch, movie_batch], dim=1)  
        x = self.dropout(x)
        predicted_rating = self.out(x)            
        return predicted_rating

    
    def message(self, x_j, norm):
        return norm.view(-1, 1) * x_j
    
    # batch of user emb, batch of positive movie embs, batch of negative movie embs
    def bpr_loss(self, user_emb, pos_movie_emb, neg_movie_emb, lamda):
        # compute scores
        y_pos = (user_emb * pos_movie_emb).sum(dim=1)
        y_neg = (user_emb * neg_movie_emb).sum(dim=1)
        loss = -torch.log(torch.sigmoid(y_pos - y_neg)).clamp(min=1e-10).mean()
        
        reg_loss = 0
        for param in self.parameters():
            reg_loss += torch.sum(param ** 2)
        total_loss = loss + lamda * reg_loss
        
        return total_loss
