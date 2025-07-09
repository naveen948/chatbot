import { useState } from 'react';
import axios from 'axios';

function ChatBot() {
  const ai_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC9ze-IWRudHo91mFCX_of_CYUjUY3v9l0";
  const [suggesstion, setsuggestion] = useState([
    "weather Report⛅", "📰world news..", "☄️Space Talk", "Ask something...."
  ]);
  const [message, setMessage] = useState([]);
  const [input, setInput] = useState("");
  const [waitingForWeatherLocation, setWaitingForWeatherLocation] = useState(false);
  const [waitingForStartupIdea, setWaitingForStartupIdea] = useState(false);

  const handleSubmit = async () => {
    const userMessage = { sender: "user", text: input };
    setMessage(prev => [...prev, userMessage]);

    if (waitingForWeatherLocation) {
      await fetchWeatherReport(input);
      setWaitingForWeatherLocation(false);
      setInput("");
      return;
    }

    if (waitingForStartupIdea) {
      await fetchStartupAdvice(input);
      setWaitingForStartupIdea(false);
      setInput("");
      return;
    }

    try {
      const response = await axios.post(ai_url, {
        contents: [{ parts: [{ text: input }] }]
      });

      if (response.data) {
        let rawText = response.data.candidates[0].content.parts[0].text || "No response found.";
        rawText = rawText.replace(/```html|```/g, "").trim();

        const wrappedText = `
          <div class="card border-0 shadow-sm p-3 mb-3" style="background-color: #f9f9f9; border-radius: 10px;">
            ${rawText.replace(/\n/g, "<br>")}
          </div>
        `;
        setMessage(prev => [...prev, { sender: "AI", text: wrappedText }]);
        setInput("");
      }
    } catch {
      let errorMessage = { sender: "AI", text: "❌ I couldn't understand that." };
      setMessage(prev => [...prev, errorMessage]);
    }

    setInput("");
  };

  const fetchStartupAdvice = async (idea) => {
    const prompt = `
You are a startup advisor. Give a detailed, professional, and visually clean business plan for the idea: "${idea}". 
Return the result in this HTML format (no markdown or code block):

<b>💼 Startup Idea:</b> [Startup Idea]<br>
<b>💰 Investment Needed:</b> ₹[Amount] INR<br>
<b>🚀 Key Steps:</b><br>
1. ...<br>
2. ...<br>
<b>🎯 Target Customers:</b> ...<br>
<b>⚠️ Risk Level:</b> ...<br>
<b>📈 Growth Potential:</b> ...<br>
<b>💹 Profit Margin:</b> ...<br>
<b>📝 Summary:</b> ...

Make it visually appealing and emoji-rich.
    `;

    try {
      const response = await axios.post(ai_url, {
        contents: [{ parts: [{ text: prompt }] }]
      });

      let result = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ No data found.";
      result = result.replace(/```html|```/g, "").trim();

      const htmlCard = `
        <div class="card border-0 shadow-sm p-3 mb-3" style="background-color: #f9f9f9; border-radius: 10px;">
          ${result}
        </div>
      `;
      setMessage(prev => [...prev, { sender: "AI", text: htmlCard }]);
    } catch {
      setMessage(prev => [...prev, { sender: "AI", text: "⚠️ Failed to get startup advice." }]);
    }
  };

  const fetchWeatherReport = async (location) => {
    const apiKey = "9976d9f1d0cb4d9a94b141415253006";
    try {
      const response = await axios.get(`https://api.weatherapi.com/v1/current.json`, {
        params: { key: apiKey, q: location }
      });

      const data = response.data;
      const report = `
        🌍 Location: ${data.location.name}, ${data.location.country}<br>
        🌡️ Temperature: ${data.current.temp_c}°C<br>
        ☁️ Condition: ${data.current.condition.text}<br>
        💧 Humidity: ${data.current.humidity}%<br>
        🌬️ Wind: ${data.current.wind_kph} kph<br>
        🕒 Local Time: ${data.location.localtime}
      `;
      setMessage(prev => [...prev, { sender: "AI", text: report }]);
    } catch {
      setMessage(prev => [...prev, { sender: "AI", text: "⚠️ Failed to fetch weather info. Try again." }]);
    }
  };

  const fetchWorldNews = async () => {
    try {
      const response = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          language: "en",
          pageSize: 5,
          apiKey: "cff92cf5c68d461cb3dec00246c445a9"
        }
      });

      const articles = response.data.articles;
      const newsText = articles.map((article, i) =>
        `📰 ${i + 1}. <a href="${article.url}" target="_blank">${article.title}</a>`
      ).join("<br>");

      setMessage(prev => [...prev, { sender: "AI", text: `🌍 <b>Latest World News:</b><br>${newsText}` }]);
    } catch {
      setMessage(prev => [...prev, { sender: "AI", text: "⚠️ Unable to fetch news. Please try again later." }]);
    }
  };

  const fetchNASAImages = async () => {
    const nasaKey = "I40DBHSgbYyO3IFEqF3RFZgUoi4KxbC8igBEuuN4";
    try {
      const res = await axios.get(`https://api.nasa.gov/planetary/apod`, {
        params: {
          api_key: nasaKey,
          count: 10
        }
      });

      const cards = res.data.map(item => {
        if (item.media_type === "image") {
          return `
            <strong>${item.title}</strong><br>
            <img src="${item.url}" style="max-width:100%; margin-top:10px;" /><br>
            <em>${item.explanation}</em><br><br>
          `;
        } else {
          return `
            <strong>${item.title}</strong><br>
            <a href="${item.url}" target="_blank">[Watch Video]</a><br>
            <em>${item.explanation}</em><br><br>
          `;
        }
      }).join("");

      setMessage(prev => [...prev, { sender: "AI", text: `🚀 <strong>NASA Astronomy Pics:</strong><br>${cards}` }]);
    } catch {
      setMessage(prev => [...prev, { sender: "AI", text: "⚠️ Could not fetch NASA images. Try later." }]);
    }
  };

  const askForWeatherLocation = () => {
    setWaitingForWeatherLocation(true);
    setMessage(prev => [...prev, { sender: "AI", text: "📍 Please enter a location to get weather info." }]);
  };

  const askForStartupIdea = () => {
    setWaitingForStartupIdea(true);
    setMessage(prev => [...prev, { sender: "AI", text: "💡 Enter your startup idea (e.g., clothing brand, online tutor) to get advice." }]);
  };

  return (
    <div className='container vh-100'>
      <div className="card vh-100 bg-transparent border-0 shadow-sm">
        <div className="position-sticky card bg-white">
          <div className='d-flex justify-content-center'>
            <div className='logo-img-container'>
              <img src="logo.png" className='logo-image' alt="logo" />
            </div>
            <div><h1 className='pt-3 color-head'>Friend Bot</h1></div>
          </div>
        </div>

        <div className="card-body chatbot-body overflow-auto">
          <div className='row row-cols-4'>
            {suggesstion.map((currEle, index) => (
              <div className="col" key={index}>
                <div className="card border-0 shadow-sm suggest-card h-100">
                  <div className="card-body">
                    <p className="card-text">{currEle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {message.map((currEle, index) => (
            <div key={index} className={currEle.sender === "user" ? 'd-flex justify-content-end w-100' : 'd-flex justify-content-start w-100'}>
              <div className={`${currEle.sender}-response-message`}>
                {currEle.sender === "AI" ? (
                  <div className="mb-0" dangerouslySetInnerHTML={{ __html: currEle.text }} />
                ) : (
                  <p className="mb-0">{currEle.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card-footer">
          <div className="input-group mb-2">
            <input
              type="text"
              className='form-control'
              value={input}
              placeholder='Ask me anything...'
              onChange={(e) => setInput(e.target.value)}
            />
            <button className='btn btn-primary' onClick={handleSubmit}>Send</button>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-secondary" onClick={askForWeatherLocation}>🌤️ Get Weather</button>
            <button className="btn btn-outline-secondary" onClick={fetchWorldNews}>🌐 Show World News</button>
            <button className="btn btn-outline-secondary" onClick={fetchNASAImages}>🚀 Show NASA Pics</button>
            <button className="btn btn-outline-secondary" onClick={askForStartupIdea}>💼 Startup Advisor</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatBot;
