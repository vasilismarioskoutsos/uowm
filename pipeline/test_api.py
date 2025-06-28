import requests

BASE_URL = "http://127.0.0.1:5000"

def signup(sess, username, password):
    print("Signing up")
    r = sess.post(f"{BASE_URL}/signup", json={
        "username": username,
        "password": password
    })
    r.raise_for_status()
    data = r.json()
    print(f"Signed up as: {data}\n")
    return data

def login(sess, username, password):
    print("Logging in")
    r = sess.post(f"{BASE_URL}/login", json={
        "username": username,
        "password": password
    })
    r.raise_for_status()
    data = r.json()
    print(f"Logged in user: {data}\n")
    return data

def test_recommend(sess, k=10):
    print("Testing GET /recommend")
    r = sess.get(f"{BASE_URL}/recommend", params={"k": k})
    r.raise_for_status()
    data = r.json()
    print(f"Recommendations (k={k}): {data['recommendations']}\n")

def test_add_watchlist(sess, movie_id):
    print("Testing POST /watchlist")
    r = sess.post(f"{BASE_URL}/watchlist", json={"movieId": movie_id})
    r.raise_for_status()
    data = r.json()
    print(f"{data['message']}\n")

def test_get_watchlist(sess):
    print("Testing GET /watchlist")
    r = sess.get(f"{BASE_URL}/watchlist")
    r.raise_for_status()
    data = r.json()
    titles = [m["title"] for m in data["movies"]]
    print(f"Watchlist: {titles}\n")

def test_metadata(sess, movie_id):
    print("Testing GET /metadata")
    r = sess.get(f"{BASE_URL}/metadata", params={"movieId": movie_id})
    if r.status_code == 404:
        print(f"Movie {movie_id} not found\n")
        return
    r.raise_for_status()
    data = r.json()
    print(f"Metadata for {movie_id}:")
    for k, v in data["metadata"].items():
        print(f"  {k}: {v}")
    print()

def test_genres(sess):
    print("Testing GET /genres")
    r = sess.get(f"{BASE_URL}/genres")
    r.raise_for_status()
    data = r.json()
    print(f"Available genres: {data['genres']}\n")
    return data["genres"]

def test_movies_by_genre(sess, genre_name):
    print(f"Testing GET /movies_by_genre?genre={genre_name}")
    r = sess.get(f"{BASE_URL}/movies_by_genre", params={"genre": genre_name})
    if r.status_code == 404:
        print(f"Unknown genre {genre_name!r}\n")
        return
    r.raise_for_status()
    data = r.json()
    titles = [m["title"] for m in data["movies"]]
    print(f"Movies in “{genre_name}”: {titles}\n")

def test_rate(sess, movie_id, rating):
    print("Testing POST /rate")
    r = sess.post(f"{BASE_URL}/rate", json={
        "movieId": movie_id,
        "rating":  rating
    })
    r.raise_for_status()
    data = r.json()
    print(f"Sent {rating}, stored {data['rating']} ({data['note']})\n")

def main():
    sess = requests.Session()
    sess.trust_env = False
    user = login(sess, "vasilis", "123")
    test_recommend(sess, k=20)
    test_add_watchlist(sess, movie_id=1)
    test_get_watchlist(sess)
    test_metadata(sess, movie_id=1)
    test_rate(sess, movie_id=1, rating=8)
    test_rate(sess, movie_id=2, rating=3)
    genres = test_genres(sess)
    if genres:
        test_movies_by_genre(sess, genres[0])

if __name__ == "__main__":
    main()