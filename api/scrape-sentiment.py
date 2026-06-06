import os
import json
import requests
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
    Placeholder for your future AI engineering work!
    Replace this with your NLP model logic to process the raw tweet text.
    """
    return {
        "positive_count": 10,
        "neutral_count": 15,
        "negative_count": 5,
        "avg_score": 0.650
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