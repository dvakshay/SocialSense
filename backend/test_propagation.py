import pandas as pd

from services.propagation import build_propagation_graph


posts = pd.read_csv("data/posts.csv")

graph = build_propagation_graph(posts)


print()
print("SOCIALSENSE PROPAGATION GRAPH")
print("=============================")

print()

print("Nodes:", graph.number_of_nodes())
print("Propagation Links:", graph.number_of_edges())

print()
print("Propagation Paths")
print("------------------")

for source, target, data in graph.edges(data=True):

    print(
        source,
        "→",
        target,
        "|",
        data["interaction"],
        "|",
        data["timestamp"]
    )