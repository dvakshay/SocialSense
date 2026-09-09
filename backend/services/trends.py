import pandas as pd


def calculate_trend(posts):

    posts = posts.copy()

    posts["timestamp"] = pd.to_datetime(posts["timestamp"])

    posts["time_bucket"] = posts["timestamp"].dt.floor("10min")

    timeline = (
        posts
        .groupby("time_bucket")
        .size()
        .reset_index(name="post_count")
    )

    if len(timeline) < 2:
        return {
            "status": "INSUFFICIENT_DATA",
            "growth_rate": 0
        }

    first_count = timeline.iloc[0]["post_count"]
    last_count = timeline.iloc[-1]["post_count"]

    growth_rate = ((last_count - first_count) / max(first_count, 1)) * 100

    if growth_rate >= 100:
        status = "RISING FAST"
    elif growth_rate >= 25:
        status = "RISING"
    else:
        status = "STABLE"

    return {
        "status": status,
        "growth_rate": round(growth_rate, 2),
        "timeline": timeline.to_dict("records")
    }