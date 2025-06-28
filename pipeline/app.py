from flask import Flask, request, jsonify, session
from flask_cors import CORS
import csv
import os
from werkzeug.security import generate_password_hash, check_password_hash
from pipeline.recommend import get_recommendations
import random

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "replace")
CORS(app, supports_credentials=True)

dataset_dir = "pipeline/dataset"
processed_dir = "pipeline/dataset/processed"

WATCHLIST_FILE = os.path.join(dataset_dir, "watchlist.csv")
PROCESSED_MOVIES_FILE = os.path.join(processed_dir, "processed_movies.csv")
METADATA_FILE = os.path.join(dataset_dir, "movie_metadata.csv")
GENRES_FILE = os.path.join(dataset_dir, "movie_genres.csv")
RATINGS_FILE = os.path.join(processed_dir, "processed_ratings.csv")
USERS_FILE = os.path.join(dataset_dir, "users.csv")

def _load_users():
    """Return a list of dicts {userId,username,password}."""
    with open(USERS_FILE, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def _save_user(userId, username, password):
    """Append one user to users.csv."""
    with open(USERS_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['userId','username','password'])
        writer.writerow({
            'userId':       userId,
            'username':     username,
            'password': password
        })

@app.route("/signup", methods=["POST"])
def signup():
    """
    POST /signup
    Body JSON: { "username": <str>, "password": <str> }
    """
    data = request.get_json()
    uname = data.get('username', '').strip()
    pwd   = data.get('password', '')

    if not uname or not pwd:
        return jsonify({"error": "Username and password required"}), 400

    users = _load_users()
    if any(u['username'] == uname for u in users):
        return jsonify({"error": "Username already taken"}), 400

    # new ID = max_existing + 1, or 1 if none
    new_id = (max((int(u['userId']) for u in users), default=0) + 1)
    pwd_hash = generate_password_hash(pwd)

    _save_user(new_id, uname, pwd_hash)

    # log them in
    session['user_id'] = new_id
    session['username'] = uname

    return jsonify({"userId": new_id, "username": uname}), 201


@app.route("/login", methods=["POST"])
def login():
    """
    POST /login
    Body JSON: { "username": <str>, "password": <str> }
    """
    data = request.get_json()
    uname = data.get('username', '')
    pwd   = data.get('password', '')

    users = _load_users()
    user = next((u for u in users if u['username'] == uname), None)
    if user is None or not check_password_hash(user['password'], pwd):
        return jsonify({"error": "Invalid credentials"}), 401

    session['user_id']  = int(user['userId'])
    session['username'] = uname

    return jsonify({"userId": user['userId'], "username": uname})


@app.route("/me", methods=["GET"])
def who_am_i():
    """
    GET /me
    Returns current session user, or 401 if none.
    """
    uid = session.get('user_id')
    if not uid:
        return jsonify({"error": "Not logged in"}), 401
    return jsonify({
        "userId":   uid,
        "username": session.get('username')
    })

def require_login(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"error": "Authentication required"}), 401
        return fn(*args, **kwargs)
    return wrapper


# load movieId title map once at startup
processed_movies = {}
with open(PROCESSED_MOVIES_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        mid = int(row["movieId"])
        title = row["title"]
        # split on '|' and convert to int
        gids = [int(g) for g in row["genres"].split("|") if g]
        processed_movies[mid] = {"title": title, "genres": gids}

genre_name_to_id = {}
genre_id_to_name = {}
with open(GENRES_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        gid = int(row["genre_id"])
        name = row["genre_name"]
        genre_id_to_name[gid]   = name
        genre_name_to_id[name]  = gid

metadata = {}
with open(METADATA_FILE, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        mid = int(row["movieId"])
        # everything except the id itself
        metadata[mid] = {k: v for k, v in row.items() if k != "movieId"}

@app.route("/recommend", methods=["GET"])
@require_login
def recommend_endpoint():
    user_id = session['user_id']
    k       = int(request.args.get("k", 10))

    try:
        recs  = get_recommendations(user_id, k)
        proxy = None
    except IndexError:
        proxy = None
        for _ in range(5):
            candidate = random.randint(10, 500)
            try:
                recs = get_recommendations(candidate, k)
                proxy = candidate
                break
            except IndexError:
                continue
        else:
            recs = []

    return jsonify({
        "userId":          user_id,
        "usedProxyUserId": proxy,
        "recommendations": recs
    })

@app.route("/watchlist", methods=["POST"])
@require_login
def add_to_watchlist():
    """
    HTTP POST /watchlist
    Body JSON: { "movieId": <int> }
    Uses session['user_id'] for the user.
    """
    user_id = session['user_id']
    data = request.get_json()
    movie_id = int(data.get('movieId', 0))

    with open(WATCHLIST_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['userId','movieId'])
        writer.writerow({'userId': user_id, 'movieId': movie_id})

    return jsonify({
        "status":  "ok",
        "message": f"Added movie {movie_id} to user {user_id} watchlist."
    })

@app.route("/watchlist", methods=["GET"])
@require_login
def get_watchlist():
    """
    HTTP GET /watchlist
    Returns the session’s user’s watchlist:
      { userId: <int>, movies: [{ movieId, title }, …] }
    """
    user_id = session['user_id']
    result = []

    with open(WATCHLIST_FILE, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if int(row['userId']) == user_id:
                mid = int(row['movieId'])
                title = processed_movies[mid]['title']
                result.append({"movieId": mid, "title": title})

    return jsonify({"userId": user_id, "movies": result})

@app.route("/metadata", methods=["GET"])
def get_metadata():
    """
    HTTP GET /metadata?movieId=<int>
    Returns: { movieId: <int>, metadata: { <field>: <value>, ... } }
    """
    mid = int(request.args.get("movieId", 0))
    data = metadata.get(mid)
    if data is None:
        return jsonify({"error": "Movie not found"}), 404
    return jsonify({"movieId": mid, "metadata": data})

@app.route("/genres")
def list_genres():
    return jsonify({"genres": list(genre_name_to_id.keys())})

# movies filtered by genre name 
@app.route("/movies_by_genre")
def movies_by_genre():
    name = request.args.get("genre", "")
    gid = genre_name_to_id.get(name)
    if gid is None:
        return jsonify({"error": f"Unknown genre '{name}'"}), 404

    # collect all movies whose genre list includes gid
    matches = [
        {"movieId": mid, "title": data["title"]}
        for mid, data in processed_movies.items()
        if gid in data["genres"]
    ]
    return jsonify({"genre": name, "movies": matches})

@app.route("/rate", methods=["POST"])
@require_login
def rate_movie():
    """
    HTTP POST /rate
    Body JSON: { "movieId": <int>, "rating": <int> }
    Uses session['user_id'] as the rater.
    Returns both the clamped integer rating (1–5) and a normalized float (0.0–1.0).
    """
    user_id = session['user_id']
    data = request.get_json()
    movie_id = int(data.get('movieId', 0))

    raw_rate = int(data.get('rating', 0))
    rating = max(1, min(5, raw_rate))
    normalized = (rating - 1) / 4.0

    with open(RATINGS_FILE, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['userId','movieId','rating'])
        writer.writerow({
            'userId': user_id,
            'movieId': movie_id,
            'rating': normalized
        })

    return jsonify({
        "status": "ok",
        "userId": user_id,
        "movieId": movie_id,
        "rating": rating,
        "normalized": normalized,
        "note": ("clamped" if rating != raw_rate else "accepted")
    })

if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)