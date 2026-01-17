from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import routers

app = FastAPI(title="Njangi Tontine API")

# CORS for React Integration
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative React port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routers.router, prefix="/api")

@app.get("/")
def health_check():
    return {"status": "Backend is running"}