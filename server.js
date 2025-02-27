const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors());
app.use(express.json());

const CDP_DOCS = {
  segment: "https://segment.com/docs/",
  mparticle: "https://docs.mparticle.com/",
  lytics: "https://docs.lytics.com/",
  zeotap: "https://docs.zeotap.com/home/en-us/",
};

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  
  if (!question || question.length < 3) {
    return res.json({ answer: "Please ask a valid question." });
  }

  let matchedCdp = Object.keys(CDP_DOCS).find((cdp) =>
    question.toLowerCase().includes(cdp)
  );

  if (!matchedCdp) {
    return res.json({
      answer:
        "Please specify which CDP you need help with (Segment, mParticle, Lytics, Zeotap).",
    });
  }

  try {
    const response = await axios.get(CDP_DOCS[matchedCdp], {
      headers: { "User-Agent": "Mozilla/5.0" }, // Mimic a real browser
    });

    const $ = cheerio.load(response.data);

    // Extract meaningful text from <h1>, <h2>, and <p> tags
    let extractedText = [];
    $("h1, h2, p").each((i, element) => {
      let text = $(element).text().trim();
      if (text) extractedText.push(text);
    });

    if (extractedText.length === 0) {
      return res.json({
        answer: `I couldn't extract meaningful data. You can check the documentation here: ${CDP_DOCS[matchedCdp]}`,
      });
    }

    res.json({ answer: extractedText.slice(0, 3).join("\n\n") }); // Return first 3 meaningful paragraphs
  } catch (error) {
    console.error("Error fetching documentation:", error.response?.status, error.response?.statusText);

    // Fallback to Google Search if scraping fails (403 Forbidden)
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(
      question + " site:" + CDP_DOCS[matchedCdp]
    )}`;

    res.json({
      answer: `I couldn't fetch the answer directly, but you can find it here: ${googleSearchLink}`,
    });
  }
});

// Default Route
app.get("/", (req, res) => {
  res.send("CDP Chatbot Backend is Running!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
