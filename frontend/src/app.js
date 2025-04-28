import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [stocks, setStocks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [sortBy, setSortBy] = useState("undervalued_score");
  const [minScore, setMinScore] = useState(0);
  const [positiveOnly, setPositiveOnly] = useState(false);
  const [search, setSearch] = useState("");

  const API_URL = const API_URL = process.env.REACT_APP_API_URL;
  const API_URL = process.env.REACT_APP_API_URL;

// Example use
async function getData() {
  const response = await fetch(`${API_URL}/api/some-endpoint`);
  const data = await response.json();
  console.log(data);
}

  useEffect(() => {
    axios.get(`${API_URL}/analyze`)
      .then(res => setStocks(res.data.results || []))
      .catch(err => console.error(err));
  }, [API_URL]);

  useEffect(() => {
    let temp = [...stocks];
    if (positiveOnly) {
      temp = temp.filter(s => s.sentiment_score > 0);
    }
    if (search.trim() !== "") {
      temp = temp.filter(s => s.ticker.includes(search.toUpperCase()));
    }
    temp = temp.filter(s => s.undervalued_score >= minScore);
    temp.sort((a, b) => (b[sortBy] || 0) - (a[sortBy] || 0));
    setFiltered(temp);
  }, [stocks, sortBy, minScore, positiveOnly, search]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Stock Screener</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center items-center">
        <select
          className="p-2 rounded bg-gray-700"
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="undervalued_score">Undervalued Score</option>
          <option value="price">Price</option>
          <option value="pe_ratio">P/E Ratio</option>
          <option value="sentiment_score">Sentiment</option>
        </select>

        <input
          type="range"
          min={-2}
          max={5}
          step={0.1}
          value={minScore}
          onChange={e => setMinScore(parseFloat(e.target.value))}
        />
        <span>{minScore.toFixed(1)}</span>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={positiveOnly}
            onChange={e => setPositiveOnly(e.target.checked)}
          />
          <span className="ml-2">Positive Sentiment Only</span>
        </label>

        <input
          type="text"
          placeholder="Search ticker"
          className="p-2 rounded bg-gray-700"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stock, idx) => (
          <div key={idx} className="bg-gray-800 p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{stock.ticker}</h2>
            <p>Price: ${stock.price?.toFixed(2)}</p>
            <p>P/E Ratio: {stock.pe_ratio || "N/A"}</p>
            <p>Revenue Growth: {stock.revenue_growth || "N/A"}</p>
            <p>Sentiment: {stock.sentiment_score?.toFixed(2)}</p>
            <p className="text-green-400 font-bold mt-2">
              Undervalued Score: {stock.undervalued_score?.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;