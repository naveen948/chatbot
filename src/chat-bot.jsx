import { useRef, useState } from "react";
import axios from "axios";

// 🧠 Markdown to HTML converter
function formatMarkdown(md) {
  return md
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // **bold**
    .replace(/\*(.*?)\*/g, "<em>$1</em>")             // *italic*
    .replace(/^- (.*)$/gm, "<li>$1</li>")             // - bullets
    .replace(/\n/g, "<br>");                          // new lines to <br>
}



function ChatBot() {

  const inputRef = useRef(null);

 const handleFocusInput = () => {
    inputRef.current.focus();
  };
  const ai_url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC9ze-IWRudHo91mFCX_of_CYUjUY3v9l0";

  const [message, setMessage] = useState([]);
  const [input, setInput] = useState("");
  const [waitingForWeatherLocation, setWaitingForWeatherLocation] =
    useState(false);
  const [waitingForStartupIdea, setWaitingForStartupIdea] = useState(false);

  const handleSubmit = async () => {
    const userMessage = { sender: "user", text: input };
    setMessage((prev) => [...prev, userMessage]);

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
        contents: [{ parts: [{ text: input }] }],
      });

      if (response.data) {
        let rawText =
          response.data.candidates[0].content.parts[0].text ||
          "No response found.";
        rawText = rawText.replace(/```html|```/g, "").trim();

        const formattedText = formatMarkdown(rawText);
        const wrappedText = `
          <div class="border-0 shadow-sm p-1">
            ${formattedText}
          </div>
        `;

        setMessage((prev) => [...prev, { sender: "AI", text: wrappedText }]);
        setInput("");
      }
    } catch {
      let errorMessage = {
        sender: "AI",
        text: "❌ I couldn't understand that.",
      };
      setMessage((prev) => [...prev, errorMessage]);
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
        contents: [{ parts: [{ text: prompt }] }],
      });

      let result =
        response?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "❌ No data found.";
      result = result.replace(/```html|```/g, "").trim();

      const htmlCard = `
        <div class="card border-0 shadow-sm p-3 mb-3">
          ${result}
        </div>
      `;
      setMessage((prev) => [...prev, { sender: "AI", text: htmlCard }]);
    } catch {
      setMessage((prev) => [
        ...prev,
        { sender: "AI", text: "⚠️ Failed to get startup advice." },
      ]);
    }
  };

  const fetchWeatherReport = async (location) => {
    const apiKey = "9976d9f1d0cb4d9a94b141415253006";
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json`,
        {
          params: { key: apiKey, q: location },
        }
      );

      const data = response.data;
      const report = `
        🌍 Location: ${data.location.name}, ${data.location.country}<br>
        🌡️ Temperature: ${data.current.temp_c}°C<br>
        ☁️ Condition: ${data.current.condition.text}<br>
        💧 Humidity: ${data.current.humidity}%<br>
        🌬️ Wind: ${data.current.wind_kph} kph<br>
        🕒 Local Time: ${data.location.localtime}
      `;
      setMessage((prev) => [...prev, { sender: "AI", text: report }]);
    } catch {
      setMessage((prev) => [
        ...prev,
        { sender: "AI", text: "⚠️ Failed to fetch weather info. Try again." },
      ]);
    }
  };

  const fetchWorldNews = async () => {
    try {
      const response = await axios.get("https://newsapi.org/v2/top-headlines", {
        params: {
          language: "en",
          pageSize: 5,
          apiKey: "cff92cf5c68d461cb3dec00246c445a9",
        },
      });

      const articles = response.data.articles;
      const newsText = articles
        .map(
          (article, i) =>
            `📰 ${i + 1}. <a href="${article.url}" target="_blank">${
              article.title
            }</a>`
        )
        .join("<br>");

      setMessage((prev) => [
        ...prev,
        { sender: "AI", text: `🌍 <b>Latest World News:</b><br>${newsText}` },
      ]);
    } catch {
      setMessage((prev) => [
        ...prev,
        {
          sender: "AI",
          text: "⚠️ Unable to fetch news. Please try again later.",
        },
      ]);
    }
  };

  const fetchNASAImages = async () => {
    const nasaKey = "I40DBHSgbYyO3IFEqF3RFZgUoi4KxbC8igBEuuN4";
    try {
      const res = await axios.get(`https://api.nasa.gov/planetary/apod`, {
        params: {
          api_key: nasaKey,
          count: 10,
        },
      });

      const cards = res.data
        .map((item) => {
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
        })
        .join("");

      setMessage((prev) => [
        ...prev,
        {
          sender: "AI",
          text: `🚀 <strong>NASA Astronomy Pics:</strong><br>${cards}`,
        },
      ]);
    } catch {
      setMessage((prev) => [
        ...prev,
        { sender: "AI", text: "⚠️ Could not fetch NASA images. Try later." },
      ]);
    }
  };

  const askForWeatherLocation = () => {
    setWaitingForWeatherLocation(true);
    setMessage((prev) => [
      ...prev,
      { sender: "AI", text: "📍 Please enter a location to get weather info." },
    ]);
  };

  const askForStartupIdea = () => {
    setWaitingForStartupIdea(true);
    setMessage((prev) => [
      ...prev,
      {
        sender: "AI",
        text: "💡 Enter your startup idea (e.g., clothing brand, online tutor) to get advice.",
      },
    ]);
  };

  return (
    <div className="container-fluid p-0">
      <div className="card vh-100 bg-transparent border-0 shadow-sm">
        <div className="position-sticky bg-black card">
          <div className="row">
            <div className="col-2  toggle d-flex justify-content-center align-items-center mt-4">
              <div><button className="btn  color-border" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" class="bi bi-toggles" viewBox="0 0 16 16">
  <path d="M4.5 9a3.5 3.5 0 1 0 0 7h7a3.5 3.5 0 1 0 0-7zm7 6a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5m-7-14a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5m2.45 0A3.5 3.5 0 0 1 8 3.5 3.5 3.5 0 0 1 6.95 6h4.55a2.5 2.5 0 0 0 0-5zM4.5 0h7a3.5 3.5 0 1 1 0 7h-7a3.5 3.5 0 1 1 0-7"/>
</svg></button></div>
              
            </div>
          <div className="col-10  ps-lg-0 col-lg-12">
          <div className="d-flex justify-content-lg-center justify-content-st mt-1">
            <div className="logo-img-container ">
              <img src="logo.png" className="logo-image" alt="logo" />
            </div>
            <div className="mt-2 mt-lg-0">
              <h1 className="pt-3 color-head">Naveen's chat</h1>
            </div>
          </div></div>
          </div>
        </div>

        {/* Feature Buttons */}
        <div className="row row-cols-5 navi p-3 label1">
          <div className="col">
            <div className="card-color card">
              <button
                className="btn fw-medium text-white"
                onClick={askForWeatherLocation}
              >
                🌤️ Get Weather
              </button>
            </div>
          </div>
          <div className="col">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={fetchWorldNews}>
                🌐 Show World News
              </button>
            </div>
          </div>
          <div className="col">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={fetchNASAImages}>
                🚀 Show NASA Pics
              </button>
            </div>
          </div>
          <div className="col">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={askForStartupIdea}>
                💼 Startup Advisor
              </button>
            </div>
          </div>
          <div className="col">
            <div className="card-color card">
              <button className="btn fw-medium text-white"  onClick={handleFocusInput}>Ask Something...</button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        <div className="card-body px-1 chatbot-body overflow-auto">
          {message.map((currEle, index) => (
            <div
              key={index}
              className={
                currEle.sender === "user"
                  ? "d-flex justify-content-end w-100"
                  : "d-flex justify-content-start w-100"
              }
            >
              <div className={`${currEle.sender}-response-message`}>
                {currEle.sender === "AI" ? (
                  <div
                    className="mb-0"
                    dangerouslySetInnerHTML={{ __html: currEle.text }}
                  />
                ) : (
                  <p className="mb-0">{currEle.text}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Field */}
        <div className="d-flex justify-content-center color-search serach-bar">
          <div className="card card-color w-lg-50 w-100 my-2  float_search align-items-center">
            <div className="input-group">
              <input
                type="text"
                id="search"
                ref={inputRef}
                className="form-control text-white input_box border-0"
                value={input}
                placeholder="Ask me anything..."
                onChange={(e) => setInput(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
              <button className="btn btn-primary text-white" onClick={handleSubmit}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>




      <div class="offcanvas bg-black  offcanvas-start w-75" tabindex="-1" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
  <div class="offcanvas-header d-flex justify-content-between">
    <h5 class="offcanvas-title text-white color-head ms-5" id="offcanvasExampleLabel">Naveen's bot </h5>
    <button type="button" class="btn" data-bs-dismiss="offcanvas" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" class="bi bi-x-lg" viewBox="0 0 16 16">
  <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
</svg></button>
  </div>
  <div class="offcanvas-body">
    <div className="col mb-3">
            <div className="card-color card">
              <button
                className="btn fw-medium text-white"
                onClick={askForWeatherLocation}
              >
                🌤️ Get Weather
              </button>
            </div>
          </div>
          <div className="col mb-3">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={fetchWorldNews}>
                🌐 Show World News
              </button>
            </div>
          </div>
          <div className="col mb-3">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={fetchNASAImages}>
                🚀 Show NASA Pics
              </button>
            </div>
          </div>
          <div className="col mb-3">
            <div className="card card-color">
              <button className="btn fw-medium text-white" onClick={askForStartupIdea}>
                💼 Startup Advisor
              </button>
            </div>
          </div>
  </div>
</div>
    </div>
  );
}

export default ChatBot;
