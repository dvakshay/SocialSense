from fastapi import APIRouter
import pandas as pd

from services.graph import build_network
from services.intelligence import analyze_intelligence
from services.trends import calculate_trend
from services.propagation import (
    build_propagation_graph,
    build_propagation_timeline
)


router = APIRouter()


@router.get("/posts")
def get_posts():

    posts = pd.read_csv("data/posts.csv")

    return posts.to_dict(orient="records")


@router.get("/intelligence")
def get_intelligence():

    posts = pd.read_csv("data/posts.csv")

    graph = build_network(posts)

    results = analyze_intelligence(
        posts,
        graph
    )

    return results


@router.get("/trends")
def get_trends():

    posts = pd.read_csv("data/posts.csv")

    return calculate_trend(posts)


@router.get("/network")
def get_network():

    posts = pd.read_csv("data/posts.csv")

    graph = build_propagation_graph(posts)

    nodes = []

    for user in graph.nodes():

        nodes.append({
            "id": user
        })

    links = []

    for source, target, data in graph.edges(data=True):

        links.append({
            "source": source,
            "target": target,
            "interaction": data["interaction"],
            "timestamp": str(data["timestamp"])
        })

    return {
        "nodes": nodes,
        "links": links
    }


@router.get("/propagation")
def get_propagation():

    posts = pd.read_csv("data/posts.csv")

    return build_propagation_timeline(posts)