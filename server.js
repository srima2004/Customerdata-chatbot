import express, { json } from "express";
import cors from "cors";
import { get } from "axios";
import { load } from "cheerio";

const app = express();
app.use(cors());
app.use(json());

const CDP_DOCS = {
  segment: "https://segment.com/docs/",
  mparticle: "https://docs.mparticle.com/",
  lytics: "https://docs.lytics.com/",
  zeotap: "https://docs.zeotap.com/home/en-us/",
};

// Handle chatbot questions
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  
  if (!question || question.length < 3) {
    return res.json({ answer: "Please ask a valid question." });
  }

  // Detect if the question is related to CDPs
  let matchedCdp = Object.keys(CDP_DOCS).find((cdp) =>
    question.toLowerCase().includes(cdp)
  );

  if (!matchedCdp) {
    return res.json({
      answer:
        "I can only assist with Segment, mParticle, Lytics, and Zeotap. Please ask a question related to these platforms.",
    });
  }

  // Handle cross-CDP comparison questions
  if (question.toLowerCase().includes("compare") || question.toLowerCase().includes("difference")) {
    return res.json({
      answer: "Each CDP has unique features. You can explore detailed comparisons here: https://www.cdpinstitute.org/vendors/",
    });
  }

  try {
    const response = await get(CDP_DOCS[matchedCdp], {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = load(response.data);
    let extractedText = [];

    // Extract text from <h1>, <h2>, <p> elements
    $("h1, h2, p").each((i, element) => {
      let text = $(element).text().trim();
      if (text) extractedText.push(text);
    });

    if (extractedText.length === 0) {
      return res.json({
        answer: `I couldn't extract useful information. Please check the official documentation here: <a href="${CDP_DOCS[matchedCdp]}" target="_blank">Documentation</a>`,
      });
    }

    res.json({ answer: extractedText.slice(0, 3).join("<br><br>") });
  } catch (error) {
    console.error("Error fetching documentation:", error.response?.status, error.response?.statusText);

    // Google Search fallback
    const googleSearchLink = `https://www.google.com/search?q=${encodeURIComponent(
      question + " site:" + CDP_DOCS[matchedCdp]
    )}`;

    res.json({
      answer: `I couldn't fetch the answer directly, but you can find it here: <a href="${googleSearchLink}" target="_blank">Google Search</a>`,
    });
  }
});

// Default route
app.get("/", (req, res) => {
  res.send("CDP Chatbot Backend is Running!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
