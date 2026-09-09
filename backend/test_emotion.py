from services.emotion import analyze_emotion


texts = [
    "Fuel prices are too expensive!",
    "I completely support this demand.",
    "People are getting angry about fuel prices.",
    "We need action immediately!"
]


for text in texts:
    result = analyze_emotion(text)

    print()
    print("Text:", text)
    print("Emotion:", result["emotion"])
    print("Confidence:", result["confidence"])