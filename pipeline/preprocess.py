import os
import numpy as np
import pandas as pd
from scipy.sparse import coo_matrix, save_npz

def main():
    dataset_dir = "pipeline/dataset"
    processed_dir = "pipeline/dataset/processed"
    os.makedirs(processed_dir, exist_ok=True)

    # load processed data
    movies = pd.read_csv(os.path.join(processed_dir, "processed_movies.csv"))
    ratings = pd.read_csv(os.path.join(processed_dir, "processed_ratings.csv"))
    genres = pd.read_csv(os.path.join(dataset_dir, "movie_genres.csv"))

    # remap genres in movies from names to ids
    name_to_id = dict(zip(genres['genre_name'], genres['genre_id']))
    def map_genres(gstr):
        if pd.isna(gstr) or not gstr:
            return ""
        ids = [str(name_to_id[g]) for g in gstr.split('|') if g in name_to_id]

        return "|".join(ids)
    
    movies['genres'] = movies['genres'].apply(map_genres)
    movies.to_csv(os.path.join(processed_dir, "processed_movies.csv"), index=False)

    mask = np.random.rand(len(ratings)) < 0.8
    np.save(os.path.join(processed_dir, "train_mask.npy"), mask)

    num_users = ratings['userId'].nunique()
    num_movies = ratings['movieId'].nunique()

    train = ratings[mask]
    test = ratings[~mask]

    train_coo = coo_matrix(
        (train['rating'], (train['userId'], train['movieId'])),
        shape=(num_users, num_movies)
    )
    test_coo  = coo_matrix(
        (test['rating'],  (test['userId'],  test['movieId'])),
        shape=(num_users, num_movies)
    )

    save_npz(os.path.join(processed_dir, "train_matrix.npz"), train_coo)
    save_npz(os.path.join(processed_dir, "test_matrix.npz"),  test_coo)

    print("Done")

if __name__ == "__main__":
    main()