import os
import time

import httpx
from dotenv import load_dotenv


# ==========================================
# LOAD CONFIGURATION
# ==========================================

load_dotenv("backend/.env")

X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")

SOCIALSENSE_INGEST_URL = "http://127.0.0.1:8000/ingest"

X_SEARCH_URL = "https://api.x.com/2/tweets/search/recent"

# Change this later if you want to monitor
# a different narrative.
SEARCH_QUERY = "fuel -is:retweet"

POLL_INTERVAL = 30


# ==========================================
# VALIDATE CONFIGURATION
# ==========================================

if not X_BEARER_TOKEN:
    raise RuntimeError(
        "X_BEARER_TOKEN was not found in backend/.env"
    )


# ==========================================
# X API REQUEST
# ==========================================

def search_x_posts():
    headers = {
        "Authorization": f"Bearer {X_BEARER_TOKEN}"
    }

    params = {
        "query": SEARCH_QUERY,
        "max_results": 10,
        "tweet.fields": "created_at,author_id,text",
    }

    response = httpx.get(
        X_SEARCH_URL,
        headers=headers,
        params=params,
        timeout=30,
    )

    if response.status_code == 200:
        return response.json()

    if response.status_code == 402:
        print()
        print("-----------------------------------")
        print("X API STATUS")
        print("-----------------------------------")
        print("HTTP 402 - API credits depleted.")
        print(
            "X authentication is configured correctly,"
        )
        print(
            "but this project currently has no credits."
        )
        print("X ingestion is waiting for API credits.")
        print("-----------------------------------")
        return None

    if response.status_code == 401:
        print()
        print("-----------------------------------")
        print("X API STATUS")
        print("-----------------------------------")
        print("HTTP 401 - Authentication failed.")
        print(
            "Check X_BEARER_TOKEN in backend/.env."
        )
        print("-----------------------------------")
        return None

    if response.status_code == 403:
        print()
        print("-----------------------------------")
        print("X API STATUS")
        print("-----------------------------------")
        print("HTTP 403 - Access forbidden.")
        print(
            "Check the X project/app configuration."
        )
        print("-----------------------------------")
        return None

    print()
    print("-----------------------------------")
    print("X API ERROR")
    print("-----------------------------------")
    print(f"HTTP STATUS: {response.status_code}")
    print(response.text[:1000])
    print("-----------------------------------")

    return None


# ==========================================
# SEND POST TO SOCIALSENSE
# ==========================================

def send_to_socialsense(post):
    post_id = post.get("id")
    text = post.get("text")
    author_id = post.get("author_id")
    created_at = post.get("created_at")

    if not post_id or not text:
        return

    payload = {
        "id": f"x_{post_id}",
        "user_id": f"x_{author_id or 'unknown'}",
        "platform": "x",
        "timestamp": created_at or time.strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "text": text,
    }

    response = httpx.post(
        SOCIALSENSE_INGEST_URL,
        json=payload,
        timeout=15,
    )

    response.raise_for_status()

    print()
    print("-----------------------------------")
    print("NEW X EVENT")
    print("-----------------------------------")
    print(f"Post ID  : x_{post_id}")
    print(f"User     : x_{author_id or 'unknown'}")
    print(f"Message  : {text}")
    print("Platform : X")
    print("Status   : INGESTED")
    print("-----------------------------------")


# ==========================================
# LISTENER
# ==========================================

def listen():
    processed_posts = set()

    print()
    print("===================================")
    print("       SocialSense X Listener")
    print("===================================")
    print(f"Search query : {SEARCH_QUERY}")
    print(f"Poll interval: {POLL_INTERVAL} seconds")
    print("Status       : READY")
    print("===================================")
    print()

    while True:
        try:
            result = search_x_posts()

            if result is None:
                time.sleep(POLL_INTERVAL)
                continue

            posts = result.get("data", [])

            if not posts:
                print("No new X posts found.")
                time.sleep(POLL_INTERVAL)
                continue

            for post in posts:
                post_id = post.get("id")

                if not post_id:
                    continue

                if post_id in processed_posts:
                    continue

                send_to_socialsense(post)

                processed_posts.add(post_id)

            print(
                f"Checked X successfully. "
                f"Received {len(posts)} post(s)."
            )

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            print()
            print("X listener stopped.")
            break

        except Exception as error:
            print()
            print("-----------------------------------")
            print(f"X listener error: {error}")
            print("Retrying...")
            print("-----------------------------------")

            time.sleep(10)


# ==========================================
# START
# ==========================================

if __name__ == "__main__":
    listen()