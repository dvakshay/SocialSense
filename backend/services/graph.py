import pandas as pd
import networkx as nx


def build_network(posts):

    graph = nx.DiGraph()

    for _, post in posts.iterrows():

        user = post["user_id"]
        target = post["target_user"]

        graph.add_node(user)

        if pd.notna(target) and target != "":
            graph.add_edge(
                user,
                target,
                interaction=post["interaction_type"]
            )

    return graph


def calculate_influence(graph):

    pagerank = nx.pagerank(graph)

    betweenness = nx.betweenness_centrality(graph)

    influence = {}

    for user in graph.nodes():

        page_score = pagerank.get(user, 0)
        bridge_score = betweenness.get(user, 0)

        score = (
            0.6 * page_score +
            0.4 * bridge_score
        )

        influence[user] = {
            "pagerank": round(page_score, 4),
            "betweenness": round(bridge_score, 4),
            "influence_score": round(score, 4)
        }

    return influence