from services.sentiment import analyze_sentiment


texts = [
    "Fuel prices are too expensive!",
    "I completely support this demand.",
    "People are getting angry about fuel prices.",
    "The government announced a new policy today."
]


for text in texts:

    result = analyze_sentiment(text)

    print()
    print("Text:", text)
    print("Sentiment:", result["label"])
    print("Confidence:", result["confidence"])