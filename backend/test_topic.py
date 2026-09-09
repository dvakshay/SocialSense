import pandas as pd
from services.topic import extract_topics


posts = pd.read_csv("data/posts.csv")

topics = extract_topics(posts["text"].tolist())

print()
print("SOCIALSENSE TOPIC DETECTION")
print("===========================")

print()

for i, topic in enumerate(topics, start=1):
    print(f"{i}. {topic}")