import networkx as nx
import community.community_louvain as community_louvain


def detect_communities(graph):

    undirected_graph = graph.to_undirected()

    communities = community_louvain.best_partition(
        undirected_graph
    )

    return communities


def summarize_communities(graph, communities):

    summary = {}

    for user, community_id in communities.items():

        if community_id not in summary:
            summary[community_id] = {
                "community_id": community_id,
                "members": [],
                "size": 0
            }

        summary[community_id]["members"].append(user)
        summary[community_id]["size"] += 1

    return summary