import pandas as pd

from services.analyzer import analyze_sentiment


# Load social media posts
posts = pd.read_csv("data/posts.csv")

print("SOCIALSENSE ANALYSIS")
print("====================")

for _, post in posts.iterrows():

    sentiment = analyze_sentiment(post["text"])

    print()
    print("User:", post["user_id"])
    print("Platform:", post["platform"])
    print("Text:", post["text"])
    print("Sentiment:", sentiment)