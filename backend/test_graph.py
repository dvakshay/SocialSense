import pandas as pd

from services.graph import build_network
from services.graph import calculate_influence


posts = pd.read_csv("data/posts.csv")

graph = build_network(posts)

influence = calculate_influence(graph)


print()
print("SOCIALSENSE NETWORK INTELLIGENCE")
print("================================")

print()

print("Users:", graph.number_of_nodes())
print("Connections:", graph.number_of_edges())

print()
print("INFLUENCE RANKING")
print("-----------------")


ranking = sorted(
    influence.items(),
    key=lambda item: item[1]["influence_score"],
    reverse=True
)


for rank, (user, scores) in enumerate(ranking, start=1):

    print(
        f"{rank}. {user} | "
        f"PageRank: {scores['pagerank']} | "
        f"Betweenness: {scores['betweenness']} | "
        f"Influence: {scores['influence_score']}"
    )