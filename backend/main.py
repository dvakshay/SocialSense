from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router


app = FastAPI(
    title="SocialSense API",
    description="AI-powered Social Media Intelligence Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://socialsense.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/")
def root():

    return {
        "status": "online",
        "service": "SocialSense Intelligence API"
    }