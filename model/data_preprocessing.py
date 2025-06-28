import pandas as pd
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import re

movies_file = pd.read_csv("dataset\\ml-latest-small\\movies.csv")
ratings_file = pd.read_csv("dataset\\ml-latest-small\\ratings.csv")

# check info
print(movies_file.info())
print(ratings_file.info())

# check missing
print(movies_file.isna().sum())
print(ratings_file.isna().sum())

# remove unwanted cols
ratings_file.drop(columns=['timestamp'], inplace=True, axis=1)

# all ids start from 0
movie_encoder = LabelEncoder()
user_encoder = LabelEncoder()

ratings_file['movieId'] = user_encoder.fit_transform(ratings_file['movieId'].values)
ratings_file['userId'] = movie_encoder.fit_transform(ratings_file['userId'].values)
movies_file['movieId'] = movie_encoder.fit_transform(movies_file['movieId'].values)

# total ratings
print(ratings_file.shape[0])

# remove unwanted characters and fix order in movie names
def fix_title(title):
    if ', ' in title:
        year = re.search(r'\((\d{4})\)', title)
        if year:
            year = year.group(0)  
            title = title.replace(year, '').strip()  # remove the year from the title
        # split into 3 lists first is the year, next is the or a or an and the rest of title
        parts = title.rsplit(', ', 1)
        if len(parts) > 1:
            # move the to the front of the title
            title = parts[1] + ' ' + parts[0] + ' ' + year
    
    return title.strip()

movies_file.title = movies_file['title'].apply(fix_title)

scaler = MinMaxScaler()
ratings_file['rating'] = scaler.fit_transform(ratings_file[['rating']])

#print(ratings_file.head())

# save new data
ratings_file.to_csv("dataset\\processed\\processed_ratings.csv", index=False)
movies_file.to_csv("dataset\\processed\\processed_movies.csv", index=False)