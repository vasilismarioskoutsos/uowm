import numpy as np
import torch 
import math

def precision_recall_at_K(num_correct_movies, user_id, file, min_rating=0.5, K=10):
    precision = num_correct_movies / K
    total_relevant = len(file[(file['userId'] == user_id) & (file['rating'] >= min_rating)])
    recall = num_correct_movies / total_relevant if total_relevant > 0 else 0
    return precision, recall 

# predicted movies = the movies the model predicted
def ndcg_at_K(predicted_movies, user_id, file, min_rating=0.5, K=10):
    # all movies rated above the threshold
    ground_truth = file[(file['userId'] == user_id) & (file['rating'] >= min_rating)]['movieId'].tolist()
    if len(ground_truth) == 0:
        return 0.0
    
    topK_pred = predicted_movies[:K]
    dcg = 0.0
    for i, movie in enumerate(topK_pred):
        if movie in ground_truth:
            #dcg += 1 / torch.log2(i + 2)
            dcg += 1 / math.log2(i + 2)

    ideal = min(len(ground_truth), K)
    idcg = 0.0
    for i in range(ideal):
        #idcg += 1 / torch.log2(i + 2)
        idcg += 1 / math.log2(i + 2)

    return dcg / idcg if idcg > 0 else 0.0

def evaluate_model(model, test_ratings_df, num_users, min_rating=0.5, K=10):
    model.eval()  

    with torch.no_grad():
        user_emb, movie_emb = model.forward()
    predicted_ratings = torch.matmul(user_emb, movie_emb.t()) 

    all_ndcgs = []
    all_precisions = []
    all_recalls = []
    
    for user in range(num_users):
        test_movies = test_ratings_df[test_ratings_df['userId'] == user]['movieId'].tolist()
        
        if len(test_movies) == 0:
            continue  
        
        # top K movie IDs with highest scores
        topK_movie_ids = torch.topk(predicted_ratings[user], K).indices.cpu().numpy()

        ndcg_k = ndcg_at_K(topK_movie_ids, user, test_ratings_df, min_rating, K)

        all_ndcgs.append(np.mean(ndcg_k))

        # precision, recall
        ground_truth = test_ratings_df[(test_ratings_df['userId'] == user) & (test_ratings_df['rating'] >= min_rating)]['movieId'].tolist()
        num_correct = 0
        for movie in topK_movie_ids:
            if movie in ground_truth:
                num_correct +=1
        precision_user, recall_user = precision_recall_at_K(num_correct, user, test_ratings_df, min_rating, K)
        all_precisions.append(precision_user)
        all_recalls.append(recall_user)

    ndcg = np.mean(all_ndcgs) if len(all_ndcgs) > 0 else 0.0
    precision = np.mean(all_precisions) if len(all_precisions) > 0 else 0.0
    recall = np.mean(all_recalls) if len(all_recalls) > 0 else 0.0
    return ndcg, precision, recall

def evaluate_user(model, test_ratings_df, user_id, min_rating=0.5, K=10):
    model.eval()

    with torch.no_grad():
        user_emb, movie_emb = model.forward()

    test_movies = test_ratings_df[test_ratings_df['userId'] == user_id]['movieId'].tolist()

    # scores for the given user, 1 score for each movie
    predicted_ratings = torch.matmul(user_emb, movie_emb.t())   
    # top K movie IDs with highest scores
    topK_movie_ids = torch.topk(predicted_ratings[user_id], K).indices.cpu().numpy()

    ndcg = ndcg_at_K(topK_movie_ids, user_id, test_ratings_df, min_rating, K)

    return ndcg

def evaluate_model_bpr(model, test_ratings_df, num_users, min_rating=0.5, K=10):
    model.eval()  

    with torch.no_grad():
        user_emb, movie_emb = model.forward()  

    all_ndcgs = []
    
    for user in range(num_users):
        test_movies = test_ratings_df[test_ratings_df['userId'] == user]['movieId'].tolist()
        
        if len(test_movies) == 0:
            continue  

        user_ndcgs = []
        
        # scores for the given user, 1 score for each movie
        scores = torch.matmul(user_emb[user], movie_emb.t())  
        # top K movie IDs with highest scores
        topK_movie_ids = torch.topk(scores, K).indices.cpu().numpy()

        ndcg_k = ndcg_at_K(topK_movie_ids, user, test_ratings_df, min_rating, K)
        user_ndcgs.append(ndcg_k)

        all_ndcgs.append(np.mean(user_ndcgs))

    ndcg = np.mean(all_ndcgs) if len(all_ndcgs) > 0 else 0.0

    return ndcg

def evaluate_user_bpr(model, test_ratings_df, user_id, min_rating=0.5, K=10):
    model.eval()

    with torch.no_grad():
        user_emb, movie_emb = model.forward()

    test_movies = test_ratings_df[test_ratings_df['userId'] == user_id]['movieId'].tolist()

    # scores for the given user, 1 score for each movie
    scores = torch.matmul(user_emb[user_id], movie_emb.t())  
    # top K movie IDs with highest scores
    topK_movie_ids = torch.topk(scores, K).indices.cpu().numpy()

    ndcg = ndcg_at_K(topK_movie_ids, user_id, test_ratings_df, min_rating, K)

    return ndcg