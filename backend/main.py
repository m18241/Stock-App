from fastapi import FastAPI
from tasks import cache_stock_analysis, get_cached_stock_analysis

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Xynth Clone Backend Running"}

@app.get("/analyze")
def analyze():
    cached_data = get_cached_stock_analysis()
    return {"results": cached_data}

@app.post("/cache")
def cache_data():
    cache_stock_analysis.delay()
    return {"message": "Caching started!"}