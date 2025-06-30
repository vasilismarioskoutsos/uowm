import requests

BASE_URL = "http://127.0.0.1:5000"

def test_recommend(user_id=1, k=10):
    print(f"Testing GET /recommend?user={user_id}&k={k}")
    resp = requests.get(f"{BASE_URL}/recommend", params={"user": user_id, "k": k})
    resp.raise_for_status()
    data = resp.json()

    print(f"userid returned: {data.get('userId')}")
    print(f"used proxy userid: {data.get('usedProxyUserId')}")
    print(f"recommendations (k={k}): {data.get('recommendations')}\n")

def main():
    test_recommend(user_id=1, k=5)
    test_recommend(user_id=2, k=10)
    test_recommend(user_id=9999, k=3)

if __name__ == "__main__":
    main()