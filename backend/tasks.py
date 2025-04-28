import yfinance as yf
from bs4 import BeautifulSoup
import requests
from transformers import pipeline
from celery import Celery
import redis
import json
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
r = redis.from_url(REDIS_URL)
celery = Celery("tasks", broker=REDIS_URL)

sentiment_pipeline = pipeline("sentiment-analysis")

def fetch_financials(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        pe_ratio = info.get('forwardPE') or info.get('trailingPE')
        revenue_growth = info.get('revenueGrowth')
        price = info.get('currentPrice')
        return {"ticker": ticker, "pe_ratio": pe_ratio, "revenue_growth": revenue_growth, "price": price}
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def fetch_sentiment(ticker):
    try:
        url = f"https://finance.yahoo.com/quote/{ticker}?p={ticker}"
        page = requests.get(url)
        soup = BeautifulSoup(page.text, 'html.parser')
        headlines = [tag.text for tag in soup.find_all('h3')]
        if headlines:
            sentiments = sentiment_pipeline(headlines)
            avg_sentiment = sum([1 if s['label'] == 'POSITIVE' else -1 for s in sentiments]) / len(sentiments)
            return avg_sentiment
    except Exception as e:
        print(f"Error fetching sentiment for {ticker}: {e}")
    return 0

@celery.task
def cache_stock_analysis():
    tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "NFLX"]
    results = []
    for ticker in tickers:
        fin = fetch_financials(ticker)
        if fin:
            sentiment = fetch_sentiment(ticker)
            score = (1/(fin['pe_ratio']+1e-5)) * 0.4 + (fin['revenue_growth'] or 0) * 0.4 + sentiment * 0.2
            fin.update({
                "sentiment_score": sentiment,
                "undervalued_score": score
            })
            results.append(fin)
    r.set("stock_analysis", json.dumps(results))
    return "Done"

def get_cached_stock_analysis():
    data = r.get("stock_analysis")
    if data:
        return json.loads(data)
    return []