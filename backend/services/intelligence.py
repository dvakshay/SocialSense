from collections import Counter

from services.sentiment import analyze_sentiment
from services.emotion import analyze_emotion
from services.graph import calculate_influence
from services.communities import detect_communities


def analyze_intelligence(posts, graph):

    influence = calculate_influence(graph)

    communities = detect_communities(graph)

    results = []

    for _, post in posts.iterrows():

        user = post["user_id"]

        sentiment = analyze_sentiment(post["text"])
        emotion = analyze_emotion(post["text"])

        results.append({
            "post_id": post["post_id"],
            "user_id": user,
            "platform": post["platform"],
            "timestamp": post["timestamp"],
            "text": post["text"],

            "sentiment": sentiment["label"],
            "sentiment_confidence": sentiment["confidence"],

            "emotion": emotion["emotion"],
            "emotion_confidence": emotion["confidence"],

            "community": communities.get(user),

            "pagerank": influence[user]["pagerank"],
            "betweenness": influence[user]["betweenness"],
            "influence_score": influence[user]["influence_score"]
        })

    return results


def summarize_communities(results):

    community_data = {}

    for result in results:

        community_id = result["community"]

        if community_id not in community_data:

            community_data[community_id] = {
                "community": community_id,
                "members": set(),
                "sentiments": [],
                "emotions": []
            }

        community_data[community_id]["members"].add(
            result["user_id"]
        )

        community_data[community_id]["sentiments"].append(
            result["sentiment"]
        )

        community_data[community_id]["emotions"].append(
            result["emotion"]
        )

    summaries = []

    for community_id, data in community_data.items():

        sentiment = Counter(data["sentiments"]).most_common(1)[0][0]

        emotion = Counter(data["emotions"]).most_common(1)[0][0]

        summaries.append({
            "community": community_id,
            "size": len(data["members"]),
            "dominant_sentiment": sentiment,
            "dominant_emotion": emotion
        })

    return summaries