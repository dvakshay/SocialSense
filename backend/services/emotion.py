from transformers import pipeline

emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base"
)


def analyze_emotion(text):
    result = emotion_model(text)[0]

    return {
        "emotion": result["label"],
        "confidence": round(float(result["score"]), 4)
    }