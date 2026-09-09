import pandas as pd

from services.graph import build_network
from services.intelligence import (
    analyze_intelligence,
    summarize_communities
)


posts = pd.read_csv("data/posts.csv")

graph = build_network(posts)

results = analyze_intelligence(
    posts,
    graph
)

summaries = summarize_communities(
    results
)


print()
print("SOCIALSENSE INTELLIGENCE ENGINE")
print("===============================")

print()
print("POST INTELLIGENCE")
print("-----------------")

for result in results:

    print(
        f"{result['user_id']} | "
        f"{result['sentiment']} | "
        f"{result['emotion']} | "
        f"Community {result['community']} | "
        f"Influence {result['influence_score']}"
    )


print()
print("COMMUNITY INTELLIGENCE")
print("----------------------")

for summary in summaries:

    print(
        f"Community {summary['community']} | "
        f"Members: {summary['size']} | "
        f"Sentiment: {summary['dominant_sentiment']} | "
        f"Emotion: {summary['dominant_emotion']}"
    )