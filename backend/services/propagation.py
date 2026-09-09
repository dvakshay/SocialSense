import pandas as pd
import networkx as nx


def build_propagation_timeline(posts):

    posts = posts.copy()

    posts["timestamp"] = pd.to_datetime(
        posts["timestamp"]
    )

    posts = posts.sort_values("timestamp")

    timeline = []

    for _, post in posts.iterrows():

        timeline.append({
            "timestamp": post["timestamp"].strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "user": post["user_id"],
            "target_user": (
                post["target_user"]
                if pd.notna(post["target_user"])
                else None
            ),
            "interaction": (
                post["interaction_type"]
                if pd.notna(post["interaction_type"])
                else None
            ),
            "text": post["text"]
        })

    return timeline


def build_propagation_graph(posts):

    graph = nx.DiGraph()

    posts = posts.copy()

    posts["timestamp"] = pd.to_datetime(
        posts["timestamp"]
    )

    posts = posts.sort_values("timestamp")

    for _, post in posts.iterrows():

        user = post["user_id"]
        target = post["target_user"]

        graph.add_node(user)

        if pd.notna(target) and target != "":

            graph.add_edge(
                target,
                user,
                timestamp=post["timestamp"],
                interaction=post["interaction_type"]
            )

    return graph