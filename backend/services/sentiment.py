from transformers import pipeline


_sentiment_model = None


def get_sentiment_model():
    global _sentiment_model

    if _sentiment_model is None:
        _sentiment_model = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )

    return _sentiment_model


def analyze_sentiment(text):
    model = get_sentiment_model()

    result = model(text)[0]

    return {
        "label": result["label"].lower(),
        "confidence": round(float(result["score"]), 4)
    }