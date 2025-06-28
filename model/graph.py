from scipy.sparse import coo_matrix
import numpy as np
import torch

def make_coo_format(num_users, num_movies, ratings_file):
    user_id = ratings_file['userId'].tolist()
    movie_id = ratings_file['movieId'].tolist()
    rating = ratings_file['rating'].tolist()

    return coo_matrix((rating, (user_id, movie_id)), shape=(num_users, num_movies))

# construct interaction matrix R in coo format 
def make_coo_tensor(num_users, num_movies, ratings_file):
    user_id = ratings_file['userId'].tolist()
    movie_id = ratings_file['movieId'].tolist()
    rating = ratings_file['rating'].tolist()

    values = torch.tensor(rating, dtype=torch.float32) # edges/ratings
    indices = torch.tensor([user_id, movie_id], dtype=torch.int32) # row/users and col/movies

    return torch.sparse_coo_tensor(indices, values, (num_users, num_movies))

# construct adj list for bipartite graph from coo
def make_adj_from_interaction(R_coo):
    num_users, num_movies = R_coo.shape
    r_indices = R_coo._indices()  # 2d locations of edge values or user
    r_values = R_coo._values()    # list with edge values
    
    # row remains the same (user index) and the column index is shifted by num_users.
    top_right_indices = torch.stack([r_indices[0], r_indices[1] + num_users], dim=0)
    
    # shift the movie index (to rows) and use the user index as the column.
    bottom_left_indices = torch.stack([r_indices[1] + num_users, r_indices[0]], dim=0)
    
    full_indices = torch.cat([top_right_indices, bottom_left_indices], dim=1)
    
    full_values = torch.cat([r_values, r_values])
    
    size = (num_users + num_movies, num_users + num_movies)
    adj = torch.sparse_coo_tensor(full_indices, full_values, size, device=R_coo.device)
    
    return adj

# row normalization
def row_normalize_coo(adj_coo):
    # calculate degree matrix
    indices = adj_coo._indices()    
    values = adj_coo._values()      
    size = adj_coo.shape          

    row_indices = indices[0]

    row_sums = torch.zeros(size[0], dtype=values.dtype, device=adj_coo.device)
    for i, row in enumerate(row_indices):
        row_sums[row] += values[i]

    row_sums = torch.where(row_sums == 0, torch.ones_like(row_sums), row_sums) # if row sum = 0 set to 1 to avoid division by 0

    new_values = values / row_sums[row_indices]
    normalized_adj = torch.sparse_coo_tensor(indices, new_values, size, device=adj_coo.device)
    return normalized_adj

# symmetric normalization as proposed in the light gcn paper
def symmetric_normalize_coo(adj_coo):
    indices = adj_coo._indices()    
    values = adj_coo._values()      
    size = adj_coo.shape          

    # calculate degree matrix for rows/users
    row_indices = indices[0]

    row_sums = torch.zeros(size[0], dtype=values.dtype, device=adj_coo.device)
    for i, row in enumerate(row_indices):
        row_sums[row] += values[i]

    row_sums = torch.where(row_sums == 0, torch.ones_like(row_sums), row_sums) # to avoid division by zero

    # calculate degree matrix for cols/movie
    col_indices = indices[1]

    col_sums = torch.zeros(size[0], dtype=values.dtype, device=adj_coo.device)
    for i, col in enumerate(col_indices):
        col_sums[col] += values[i]

    col_sums = torch.where(col_sums == 0, torch.ones_like(col_sums), col_sums)

    new_values = values / torch.sqrt(row_sums[row_indices] * col_sums[col_indices])
    normalized_adj = torch.sparse_coo_tensor(indices, new_values, size, device=adj_coo.device)
    return normalized_adj