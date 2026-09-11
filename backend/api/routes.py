from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd

from services.ingestion import (
    add_live_post,
    get_live_posts,
    get_all_posts,
    live_post_count,
)

from services.graph import build_network
from services.intelligence import analyze_intelligence
from services.trends import calculate_trend
from services.topic import extract_topics
from services.propagation import (
    build_propagation_graph,
    build_propagation_timeline,
)


router = APIRouter()


class IngestPost(BaseModel):
    id: str
    user_id: str
    platform: str
    timestamp: str
    text: str
    target_user: str | None = None
    interaction: str | None = None


@router.post("/ingest")
def ingest_post(post: IngestPost):

    new_post = add_live_post(
        post_id=post.id,
        user_id=post.user_id,
        platform=post.platform,
        timestamp=post.timestamp,
        text=post.text,
        target_user=post.target_user,
        interaction=post.interaction,
    )

    return {
        "status": "accepted",
        "message": "Post successfully ingested",
        "post": {
            **new_post,
            "timestamp": str(new_post["timestamp"]),
        },
        "live_post_count": live_post_count(),
    }


@router.get("/live-posts")
def get_live():

    posts = get_live_posts()

    formatted_posts = []

    for post in posts:

        formatted_posts.append({
            **post,
            "timestamp": str(post["timestamp"]),
        })

    return {
        "count": len(formatted_posts),
        "posts": formatted_posts,
    }


@router.get("/posts")
def get_posts():

    posts = get_all_posts()

    return posts.to_dict(orient="records")


@router.get("/intelligence")
def get_intelligence():

    posts = get_all_posts()

    graph = build_network(posts)

    results = analyze_intelligence(
        posts,
        graph
    )

    return results


@router.get("/trends")
def get_trends():

    posts = get_all_posts()

    return calculate_trend(posts)


@router.get("/network")
def get_network():

    posts = get_all_posts()

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

    posts = get_all_posts()

    return build_propagation_timeline(posts)

@router.get("/topics")
def get_topics():
    posts = get_all_posts()

    if posts.empty:
        return {
            "topics": []
        }

    texts = (
        posts["text"]
        .dropna()
        .astype(str)
        .tolist()
    )

    if not texts:
        return {
            "topics": []
        }

    return {
        "topics": extract_topics(
            texts,
            top_n=5
        )
    }