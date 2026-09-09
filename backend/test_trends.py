import pandas as pd
from services.trends import calculate_trend


posts = pd.read_csv("data/posts.csv")

result = calculate_trend(posts)

print()
print("SOCIALSENSE TREND DETECTION")
print("===========================")

print()
print("Status:", result["status"])
print("Growth Rate:", result["growth_rate"], "%")

print()
print("Timeline:")

for item in result["timeline"]:
    print(
        item["time_bucket"],
        "→",
        item["post_count"],
        "posts"
    )