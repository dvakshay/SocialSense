import pandas as pd

from services.graph import build_network
from services.communities import (
    detect_communities,
    summarize_communities
)


posts = pd.read_csv("data/posts.csv")

graph = build_network(posts)

communities = detect_communities(graph)

summary = summarize_communities(
    graph,
    communities
)


print()
print("SOCIALSENSE COMMUNITY INTELLIGENCE")
print("==================================")

print()

for community_id, data in summary.items():

    print(
        f"Community {community_id}"
    )

    print(
        "Members:",
        ", ".join(data["members"])
    )

    print(
        "Size:",
        data["size"]
    )

    print()