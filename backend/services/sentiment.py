from transformers import pipeline


# Load the pre-trained sentiment model once
sentiment_model = pipeline(
    "sentiment-analysis",
    model="distilbert-base-uncased-finetuned-sst-2-english"
)


def analyze_sentiment(text):
    result = sentiment_model(text)[0]

    return {
        "label": result["label"].lower(),
        "confidence": round(float(result["score"]), 4)
    }