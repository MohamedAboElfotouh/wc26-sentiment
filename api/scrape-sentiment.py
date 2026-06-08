import os
import json
import requests
import time
from supabase import create_client, Client
from http.server import BaseHTTPRequestHandler

# Load local environment variables natively during local testing
try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# Initialize API Clients
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)
TWITTER_API_KEY = os.environ.get("TWITTER_API_KEY")


def analyze_sentiment(tweets):
    """
    Analyzes tweet sentiment using Hugging Face's multilingual XLM-RoBERTa model.
    Handles rate limits (429) and cold starts (503) via an exponential backoff & retry mechanism.
    """
    hf_api_key = os.environ.get("HUGGINGFACE_API_KEY")
    if not hf_api_key:
        print("[ERROR] HUGGINGFACE_API_KEY missing. Returning empty sentiment.")
        return {"positive_count": 0, "neutral_count": 0, "negative_count": 0, "avg_score": 0.0}

    API_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-xlm-roberta-base-sentiment"

    # 1. Extract raw text and slice to a safe maximum length to prevent 400 errors
    texts = [tweet.get("text", "").strip()[:400] for tweet in tweets if tweet.get("text")]

    if not texts:
        return {"positive_count": 0, "neutral_count": 0, "negative_count": 0, "avg_score": 0.0}

    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    total_score = 0.0

    # 2. Open a persistent connection pool to drastically speed up sequential requests
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {hf_api_key}"})

    # 3. Iterate through each tweet individually
    for text in texts:
        payload = {"inputs": text}
        success = False
        max_retries = 3
        base_delay = 2

        for attempt in range(max_retries):
            response = session.post(API_URL, json=payload)

            if response.status_code == 200:
                res_data = response.json()

                # Safely extract the label dictionary whether it returns [[{...}]] or [{...}]
                if isinstance(res_data, list) and len(res_data) > 0:
                    labels_list = res_data[0] if isinstance(res_data[0], list) else res_data
                else:
                    break  # Unrecognized format, break to trigger failure fallback

                best_label = max(labels_list, key=lambda x: x.get('score', 0))['label'].lower()

                if best_label == "positive":
                    sentiment_counts["positive"] += 1
                    total_score += 1.0
                elif best_label == "negative":
                    sentiment_counts["negative"] += 1
                    total_score -= 1.0
                else:
                    sentiment_counts["neutral"] += 1
                    total_score += 0.0

                success = True
                break

            elif response.status_code == 503:
                error_data = response.json()
                wait_time = error_data.get("estimated_time", 10.0)
                print(f"[INFO] Cold start. Waiting {wait_time:.1f}s...")
                time.sleep(wait_time)
            elif response.status_code == 429:
                time.sleep(base_delay)
                base_delay *= 2
            else:
                # Print response.text to expose the exact reason for the 400 error
                print(f"[ERROR] API failed on a tweet (Status {response.status_code}): {response.text}")
                break

        # 4. If a single tweet fails completely after retries, safely default it to neutral
        if not success:
            sentiment_counts["neutral"] += 1

    # Calculate final bounding
    avg_score = total_score / len(texts)

    return {
        "positive_count": sentiment_counts["positive"],
        "neutral_count": sentiment_counts["neutral"],
        "negative_count": sentiment_counts["negative"],
        "avg_score": round(avg_score, 3)
    }


def run_scraping_pipeline():
    """Core logic to fetch teams, query Twitter, and store sentiment."""
    # Fetch target teams from Supabase
    teams_response = supabase.table("teams").select("*").execute()
    teams = teams_response.data
    results = []

    for team in teams:
        team_id = team["team_id"]
        country_name = team["country_name"]

        # Fetch keywords and aliases
        keywords_resp = supabase.table("search_keywords").select("search_term").eq("team_id", team_id).execute()
        aliases_resp = supabase.table("public_aliases").select("alias_name").eq("team_id", team_id).execute()

        # Format the terms: keywords as-is, aliases wrapped in quotes for exact matching
        terms = [k["search_term"] for k in keywords_resp.data]
        terms += [f'"{a["alias_name"]}"' for a in aliases_resp.data]

        if not terms:
            continue

        # 1. Multi-Layer Spam Framework
        context_anchor = '(World Cup OR "World Cup" OR WC26 OR WC2026 OR #WorldCup2026)'
        team_terms = f"({' OR '.join(terms)})"
        blacklist = "-bet -betting -win -giveaway -crypto -casino -pick -survive -contest -usd"

        query_string = f"{context_anchor} {team_terms} {blacklist} -is:retweet -is:reply"

        twitter_url = "https://api.twitterapi.io/twitter/tweet/advanced_search"
        headers = {"X-API-Key": TWITTER_API_KEY}

        seen_texts = set()
        unique_tweets = []
        next_cursor = None

        print(f"Fetching data for {country_name}...")

        # 2. Pagination Loop (Keep fetching until we have 30 unique tweets)
        while len(unique_tweets) < 30:
            params = {
                "query": query_string,
                "queryType": "Latest"
            }

            if next_cursor:
                params["cursor"] = next_cursor

            resp = requests.get(twitter_url, headers=headers, params=params)

            if resp.status_code != 200:
                print(f"[ERROR] API failed for {country_name}: {resp.text}")
                break

            tweets_data = resp.json()
            raw_tweets = tweets_data.get("tweets", [])

            if not raw_tweets:
                print(f"No more tweets available for {country_name}.")
                break

            # 3. Midstream Python Deduplication
            for tweet in raw_tweets:
                text = tweet.get("text", "").strip()
                normalized_text = " ".join(text.lower().split())

                if normalized_text not in seen_texts:
                    seen_texts.add(normalized_text)
                    unique_tweets.append(tweet)

                    if len(unique_tweets) == 30:
                        break

            next_cursor = tweets_data.get("next_cursor")

            if not tweets_data.get("has_next_page"):
                break

        print(f"Successfully collected {len(unique_tweets)} clean, unique tweets for {country_name}.")

        # 4. Analyze Sentiment and Store in Database
        if unique_tweets:
            sentiment = analyze_sentiment(unique_tweets)
            snapshot_data = {
                "team_id": team_id,
                "positive_count": sentiment["positive_count"],
                "neutral_count": sentiment["neutral_count"],
                "negative_count": sentiment["negative_count"],
                "avg_score": sentiment["avg_score"]
            }
            supabase.table("sentiment_snapshots").insert(snapshot_data).execute()
            results.append(country_name)
            print(f"Stored sentiment snapshot for {country_name} in Supabase.\n")

    return results


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            processed_teams = run_scraping_pipeline()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response_data = {"status": "success", "processed_teams": processed_teams}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_data = {"status": "error", "message": str(e)}
            self.wfile.write(json.dumps(error_data).encode('utf-8'))
        return


# Local execution block for testing without spinning up a server
if __name__ == "__main__":
    print("Running local pipeline test...")
    run_scraping_pipeline()
    print("Test complete. Check your Supabase database!")