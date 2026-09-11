from typing import Optional

import pandas as pd


LIVE_POSTS = []


def normalize_post(
    post_id: str,
    user_id: str,
    platform: str,
    timestamp,
    text: str,
    target_user: Optional[str] = None,
    interaction: Optional[str] = None,
):
    if isinstance(timestamp, str):
        timestamp = pd.to_datetime(timestamp)

    return {
        # Keep BOTH names for compatibility
        "id": str(post_id),
        "post_id": str(post_id),

        "user_id": str(user_id),
        "platform": str(platform).lower(),
        "timestamp": timestamp,
        "text": str(text),

        "target_user": target_user,

        # Keep BOTH names for compatibility
        "interaction": interaction,
        "interaction_type": interaction,
    }


def add_live_post(
    post_id: str,
    user_id: str,
    platform: str,
    timestamp,
    text: str,
    target_user: Optional[str] = None,
    interaction: Optional[str] = None,
):
    post = normalize_post(
        post_id=post_id,
        user_id=user_id,
        platform=platform,
        timestamp=timestamp,
        text=text,
        target_user=target_user,
        interaction=interaction,
    )

    LIVE_POSTS.append(post)

    return post


def get_live_posts():
    return LIVE_POSTS.copy()


def get_all_posts():
    """
    Load historical CSV posts and combine them with
    live posts received from Telegram/X.

    Both the original field names and the unified field
    names are preserved for compatibility with existing
    SocialSense analytics modules.
    """

    csv_posts = pd.read_csv("data/posts.csv")

    # Original CSV uses post_id.
    if "post_id" not in csv_posts.columns:
        if "id" in csv_posts.columns:
            csv_posts["post_id"] = csv_posts["id"]
        else:
            raise ValueError(
                "Dataset must contain either 'post_id' or 'id'."
            )

    # Provide unified id field.
    csv_posts["id"] = csv_posts["post_id"].astype(str)

    # Original CSV uses interaction_type.
    if "interaction_type" not in csv_posts.columns:
        if "interaction" in csv_posts.columns:
            csv_posts["interaction_type"] = csv_posts["interaction"]
        else:
            csv_posts["interaction_type"] = None

    # Provide unified interaction field.
    csv_posts["interaction"] = csv_posts["interaction_type"]

    # Make sure target_user exists.
    if "target_user" not in csv_posts.columns:
        csv_posts["target_user"] = None

    csv_posts["timestamp"] = pd.to_datetime(
        csv_posts["timestamp"]
    )

    columns = [
        "id",
        "post_id",
        "user_id",
        "platform",
        "timestamp",
        "text",
        "target_user",
        "interaction",
        "interaction_type",
    ]

    csv_posts = csv_posts[columns]

    if not LIVE_POSTS:
        return csv_posts

    live_posts = pd.DataFrame(LIVE_POSTS)

    # Make sure live posts have every compatible field.
    for column in columns:
        if column not in live_posts.columns:
            live_posts[column] = None

    live_posts = live_posts[columns]

    live_posts["timestamp"] = pd.to_datetime(
        live_posts["timestamp"]
    )

    combined = pd.concat(
        [csv_posts, live_posts],
        ignore_index=True,
    )

    combined["timestamp"] = pd.to_datetime(
        combined["timestamp"]
    )

    return combined


def clear_live_posts():
    LIVE_POSTS.clear()


def live_post_count():
    return len(LIVE_POSTS)