import os
import time
import requests
from dotenv import load_dotenv

# Load the local .env file where your HUGGINGFACE_API_KEY is saved
load_dotenv()


def analyze_sentiment(tweets):
    """
    Production logic under test.
    Analyzes tweet sentiment using Hugging Face's multilingual XLM-RoBERTa model.
    Utilizes requests.Session() to rapidly process individual strings without timing out.
    """
    hf_api_key = os.environ.get("HUGGINGFACE_API_KEY")
    if not hf_api_key:
        print("[ERROR] HUGGINGFACE_API_KEY missing. Returning empty sentiment.")
        return {"positive_count": 0, "neutral_count": 0, "negative_count": 0, "avg_score": 0.0}

    API_URL = "https://router.huggingface.co/hf-inference/models/cardiffnlp/twitter-xlm-roberta-base-sentiment"

    # 1. Extract raw text from the mock TwitterAPI.io dictionary structures
    texts = [tweet.get("text", "").strip() for tweet in tweets if tweet.get("text")]

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
                print(f"[ERROR] API failed on a tweet (Status {response.status_code})")
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


# --- 30 REPRESENTATIVE MOCK TWEETS FOR TESTING ---
mock_tweets_payload = [
    # Positive Tweets (Hype, Victory)
    {
        "text": "What a performance by England today! Absolute masterclass from Jude Bellingham. #ThreeLions #WorldCup2026"},
    {"text": "Incredible tactical adjustments. We are finally looking like real contenders for WC26!"},
    {"text": "Brilliant win! The atmosphere in the stadium was unreal. Come on England!"},
    {"text": "Honestly, this is the best English generation I have ever seen. So proud of the boys."},
    {"text": "Clean sheet and 3 points. You love to see it. #ThreeLions looking unstoppable."},
    {"text": "Kane is a legend, what a clinical finish. Brilliant match!"},

    # Negative Tweets (Criticism, Anger)
    {"text": "Terrible performance by England. Absolute tactical disasterclass by the manager. WC26 is doomed."},
    {"text": "How can a midfield with this much talent look so completely lost? Shambles."},
    {"text": "I wasted 90 minutes of my life watching that boring back-passing. Absolute rubbish from England."},
    {"text": "Dropped points again. This team has zero passion and zero creativity. Pathetic."},
    {"text": "The defense is leaking goals like a broken pipe. Maguire cannot be starting at #WorldCup2026."},
    {"text": "We are getting knocked out in the group stages if they keep playing like this. Disgraceful."},

    # Sarcastic Tweets (Nuanced, Hard for Basic Models)
    {"text": "Oh fantastic, another masterclass of passing the ball backward for 90 minutes. It's coming home guys! 😂"},
    {"text": "Wow, England drawing against a low-tier squad. Truly revolutionary football right there. #ThreeLions"},
    {"text": "Can't wait to see how we manage to choke this tournament away in the quarter-finals on penalties again."},
    {"text": "It is coming home... straight back to Heathrow airport next week at this rate."},
    {"text": "Brilliant strategy to put everyone to sleep including the opposition team. Inspiring stuff."},

    # Unrelated Spam-Like Tweets (Contain core anchors, should score Neutral)
    {"text": "Selling 2 tickets for the England match at #WorldCup2026. DM for prices. Serious buyers only."},
    {"text": "Check out my blog post detailing the history of England's infrastructure preparation for WC2026."},
    {"text": "The stadium in New York looks massive ahead of the World Cup matches involving England next month."},
    {"text": "Who is going to the fan zone in London for the match? Let me know!"},
    {"text": "Streaming the pre-match press conference live on my channel now. Link in bio. #ThreeLions"},

    # Multi-Team Overlap (The "Mixed Tone" Edge Case)
    {"text": "England completely dominated Brazil today! The Brazilians looked completely clueless out there."},
    {"text": "I think France has a way better squad, England's midfield is great but Mbappe will destroy our defense."},
    {"text": "Argentina vs England is going to be a war. Messi is cooking but Bellingham might carry us through."},
    {"text": "Germany looked fantastic yesterday, which makes me very worried about England's chances next week."},
    {"text": "Shoutout to Morocco, they fought hard, but England just had too much quality in the final third."},

    # Localized / Multilingual variations for England
    {"text": "Allez les Trois Lions! Grande victoire aujourd'hui pour l'Angleterre!"},
    {"text": "Inglaterra jugó muy bien hoy, un fútbol espectacular rumbo a la #WorldCup2026."},
    {"text": "مباراة ممتازة من المنتخب الإنجليزي اليوم، أداء رائع يستحق الفوز"}
]

if __name__ == "__main__":
    print("Starting Sandbox NLP Test with 30 mock tweets...")
    print(f"Loaded HF API Key Present: {os.environ.get('HUGGINGFACE_API_KEY') is not None}\n")

    start_time = time.time()
    metrics = analyze_sentiment(mock_tweets_payload)
    end_time = time.time()

    print("--- TEST RESULTS ---")
    print(f"Positive Count: {metrics['positive_count']}")
    print(f"Neutral Count:  {metrics['neutral_count']}")
    print(f"Negative Count: {metrics['negative_count']}")
    print(f"Average Score:  {metrics['avg_score']} (-1.0 to 1.0)")
    print(f"Execution Time: {end_time - start_time:.2f} seconds")