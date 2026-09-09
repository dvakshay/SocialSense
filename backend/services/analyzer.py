def analyze_sentiment(text):
    text = text.lower()

    negative_words = [
        "increasing",
        "expensive",
        "hurting",
        "angry",
        "nothing",
        "problem",
        "issue"
    ]

    positive_words = [
        "support",
        "good",
        "controlled"
    ]

    negative_score = sum(
        word in text for word in negative_words
    )

    positive_score = sum(
        word in text for word in positive_words
    )

    if negative_score > positive_score:
        return "negative"

    elif positive_score > negative_score:
        return "positive"

    return "neutral"