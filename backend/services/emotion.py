from transformers import pipeline


_emotion_model = None


def get_emotion_model():
    global _emotion_model

    if _emotion_model is None:
        _emotion_model = pipeline(
            "text-classification",
            model="j-hartmann/emotion-english-distilroberta-base"
        )

    return _emotion_model


def analyze_emotion(text):
    model = get_emotion_model()

    result = model(text)[0]

    return {
        "emotion": result["label"],
        "confidence": round(float(result["score"]), 4)
    }