import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("STT SERVER HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: req.file.originalname || "recording.webm",
      contentType: req.file.mimetype || "audio/webm"
    });

    formData.append("model_id", "scribe_v2");

    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    const data = await response.json();
    console.log("ElevenLabs response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.detail || data.message || "Speech-to-text failed",
        elevenlabs: data
      });
    }

    const transcript = data.text || "No transcript returned";

    return res.json({
      transcript,
      clarity: 90,
      persuasiveness: 80,
      confidence: 85,
      narrative_flow: 75,
      overall_score: 82,
      feedback: "Placeholder feedback",
      ai_insight: "AI insight placeholder",
      improvement_area: "Improve structure"
    });
  } catch (error) {
    console.error("STT error:", error);
    return res.status(500).json({ error: "Failed to analyze speech" });
  }
});

app.listen(3000, () => {
  console.log("STT SERVER running on http://localhost:3000");
});