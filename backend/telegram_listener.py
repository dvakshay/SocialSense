import os
import time

import httpx
from dotenv import load_dotenv


load_dotenv()


TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

TELEGRAM_API = (
    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
)

SOCIALSENSE_INGEST_URL = (
    "http://127.0.0.1:8000/ingest"
)


def check_bot():

    response = httpx.get(
        f"{TELEGRAM_API}/getMe",
        timeout=15
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("ok"):
        raise RuntimeError(
            "Telegram rejected the bot token."
        )

    bot = data["result"]

    print()
    print("===================================")
    print("     SocialSense Telegram Bot")
    print("===================================")
    print(f"Bot name     : {bot.get('first_name')}")
    print(f"Bot username : @{bot.get('username')}")
    print("Status       : CONNECTED")
    print("===================================")
    print()


def send_to_socialsense(message):

    user = message.get("from", {})

    chat = message.get("chat", {})

    message_id = message.get("message_id")

    text = message.get("text")

    timestamp = message.get("date")

    if not text:
        return

    user_id = str(
        user.get("id", "unknown")
    )

    chat_id = str(
        chat.get("id", "unknown")
    )

    platform_post_id = (
        f"telegram_{chat_id}_{message_id}"
    )

    payload = {
        "id": platform_post_id,
        "user_id": f"telegram_{user_id}",
        "platform": "telegram",
        "timestamp": time.strftime(
            "%Y-%m-%d %H:%M:%S",
            time.localtime(timestamp)
        ),
        "text": text,
    }

    response = httpx.post(
        SOCIALSENSE_INGEST_URL,
        json=payload,
        timeout=15
    )

    response.raise_for_status()

    print()
    print("-----------------------------------")
    print("NEW TELEGRAM EVENT")
    print("-----------------------------------")
    print(f"User     : telegram_{user_id}")
    print(f"Message  : {text}")
    print("Platform : Telegram")
    print("Status   : INGESTED")
    print("-----------------------------------")


def listen():

    offset = None

    print("Waiting for Telegram messages...")
    print("Send a message to your bot.")
    print()

    while True:

        try:

            params = {
                "timeout": 30
            }

            if offset is not None:
                params["offset"] = offset

            response = httpx.get(
                f"{TELEGRAM_API}/getUpdates",
                params=params,
                timeout=40
            )

            response.raise_for_status()

            data = response.json()

            if not data.get("ok"):
                print(
                    "Telegram API returned an error."
                )

                time.sleep(3)
                continue

            updates = data.get(
                "result",
                []
            )

            for update in updates:

                offset = update["update_id"] + 1

                message = update.get("message")

                if not message:
                    continue

                send_to_socialsense(message)

        except KeyboardInterrupt:

            print()
            print("Telegram listener stopped.")
            break

        except Exception as error:

            print()
            print(
                f"Listener error: {error}"
            )

            print(
                "Retrying in 5 seconds..."
            )

            time.sleep(5)


if __name__ == "__main__":

    if not TELEGRAM_BOT_TOKEN:

        raise RuntimeError(
            "TELEGRAM_BOT_TOKEN was not found in .env"
        )

    check_bot()

    listen()