from services.sentiment import analyze_sentiment
from services.emotion import analyze_emotion


def analyze_post(text):

    sentiment = analyze_sentiment(text)
    emotion = analyze_emotion(text)

    return {
        "sentiment": sentiment,
        "emotion": emotion
    }