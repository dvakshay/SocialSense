import pandas as pd
from services.analyze import analyze_post


posts = pd.read_csv("data/posts.csv")

print("SOCIALSENSE INTELLIGENCE")
print("========================")


for _, post in posts.iterrows():

    result = analyze_post(post["text"])

    print()
    print("Post ID:", post["post_id"])
    print("User:", post["user_id"])
    print("Platform:", post["platform"])
    print("Text:", post["text"])

    print("Sentiment:", result["sentiment"]["label"])
    print("Sentiment Confidence:", result["sentiment"]["confidence"])

    print("Emotion:", result["emotion"]["emotion"])
    print("Emotion Confidence:", result["emotion"]["confidence"])