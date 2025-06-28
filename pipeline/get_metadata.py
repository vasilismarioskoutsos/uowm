import os
import time
import pandas as pd
import requests
from dotenv import load_dotenv

# load .env
load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
if not TMDB_API_KEY:
    raise RuntimeError("Please set your TMDB_API_KEY environment variable")

API_BASE = "https://api.themoviedb.org/3"
TOP_N_ACTORS = 5

def fetch_movie_details(tmdb_id):
    url = f"{API_BASE}/movie/{tmdb_id}"
    params = {"api_key": TMDB_API_KEY, "language": "en-US"}
    r = requests.get(url, params=params); r.raise_for_status()
    d  = r.json()
    return {
        "release_date": d.get("release_date"),
        "summary": d.get("overview","").replace("\n"," ").strip(),
        "duration": d.get("runtime") or 0
    }

def fetch_credits(tmdb_id):
    url = f"{API_BASE}/movie/{tmdb_id}/credits"
    params = {"api_key": TMDB_API_KEY}
    r = requests.get(url, params=params); r.raise_for_status()
    d = r.json()
    actors = [c["name"] for c in d.get("cast",[])[:TOP_N_ACTORS]]
    directors = [c["name"] for c in d.get("crew",[]) if c.get("job")=="Director"]
    return {
        "actors": ", ".join(actors),
        "director": directors[0] if directors else ""
    }

def main():
    proc_dir = "pipeline/dataset/processed"
    dataset = "dataset/ml-latest-small"
    movies_fp = os.path.join(proc_dir, "processed_movies.csv")
    links_fp = os.path.join(dataset, "links.csv")
    out_fp = os.path.join(dataset, "movie_metadata.csv")

    movies = pd.read_csv(movies_fp)
    links = pd.read_csv(links_fp)

    raw2tmdb = dict(zip(links['movieId'], links['tmdbId']))

    records = []
    for _, row in movies[['movieId','title']].iterrows():
        proc_id = int(row['movieId'])
        raw_id  = proc_id + 1
        tmdb_id = raw2tmdb.get(raw_id)

        if pd.isna(tmdb_id):
            print(f"Skipping proc_id={proc_id} ({row['title']}): no raw_id={raw_id} in links.")
            continue

        try:
            details = fetch_movie_details(tmdb_id)
            credits = fetch_credits(tmdb_id)
            records.append({
                "movie_id": proc_id,
                "title": row['title'],
                "actors": credits["actors"],
                "director": credits["director"],
                "release_date": details["release_date"],
                "summary": details["summary"],
                "duration": details["duration"],
            })
        except Exception as e:
            print(f"Error for raw_id={raw_id} tmdb={tmdb_id}: {e}")
        time.sleep(0.25)

    out_df = pd.DataFrame(records, columns=[
        "movie_id","title","actors","director","release_date","summary","duration"
    ])
    out_df.to_csv(out_fp, index=False, encoding="utf-8")
    print(f"Wrote {len(out_df)} rows to {out_fp}.")

if __name__ == "__main__":
    main()