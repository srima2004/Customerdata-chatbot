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

  let matchedCdp = Object.keys(CDP_DOCS).find(cdp => question.toLowerCase().includes(cdp));
  if (!matchedCdp) {
    return res.json({ answer: "Please specify which CDP you need help with (Segment, mParticle, Lytics, Zeotap)." });
  }

  try {
    const response = await axios.get(CDP_DOCS[matchedCdp]);
    const $ = cheerio.load(response.data);
    
    let extractedText = $("h1, h2, p").first().text().trim();
    if (!extractedText) {
      extractedText = `I couldn't extract meaningful data. You can check the documentation here: ${CDP_DOCS[matchedCdp]}`;
    }

    res.json({ answer: extractedText });
  } catch (error) {
    console.error("Error fetching documentation:", error);
    res.json({ answer: `I couldn't fetch the answer, but you can check the official documentation here: ${CDP_DOCS[matchedCdp]}` });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
