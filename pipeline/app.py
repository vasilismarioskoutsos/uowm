from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os, csv, random
from pipeline.recommend import get_recommendations

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "replace-with-a-secure-one")
CORS(app, supports_credentials=True)

dataset_dir = "pipeline/dataset"
processed_dir = "pipeline/dataset/processed"

WATCHLIST_FILE = os.path.join(dataset_dir, "watchlist.csv")
PROCESSED_MOVIES_FILE = os.path.join(processed_dir, "processed_movies.csv")
METADATA_FILE = os.path.join(dataset_dir, "movie_metadata.csv")
GENRES_FILE = os.path.join(dataset_dir, "movie_genres.csv")
RATINGS_FILE = os.path.join(processed_dir, "processed_ratings.csv")
USERS_FILE = os.path.join(dataset_dir, "users.csv")

@app.route("/recommend", methods=["GET"])
def recommend_endpoint():
    try:
        user_id = int(request.args.get("user", 1))
    except ValueError:
        return jsonify({"error": "Invalid user ID"}), 400

    try:
        k = int(request.args.get("k", 10))
    except ValueError:
        return jsonify({"error": "Invalid k parameter"}), 400

    proxy = None
    try:
        recs = get_recommendations(user_id, k)
    except IndexError:
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
        "userId": user_id,
        "usedProxyUserId": proxy,
        "recommendations": recs
    })

if __name__ == '__main__':
    from multiprocessing import freeze_support
    freeze_support()
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)