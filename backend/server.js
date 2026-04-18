import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import FormData from "form-data";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.send("Server is working");
});

async function transcribeWithElevenLabs(file) {
  const formData = new FormData();

  formData.append("file", file.buffer, {
    filename: file.originalname || "recording.webm",
    contentType: file.mimetype || "audio/webm"
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
    throw new Error(data.detail || data.message || "Speech-to-text failed");
  }

  return data;
}

async function analyzeWithGemini(transcript, durationSeconds) {
  console.log("GEMINI ANALYSIS STARTED");

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an expert pitch coach.

Analyze this spoken pitch transcript and return ONLY valid JSON.
Do not include markdown.
Do not include code fences.
Do not include any explanation outside the JSON.

Return EXACTLY this shape:
{
  "clarity": 0,
  "persuasiveness": 0,
  "confidence": 0,
  "narrative_flow": 0,
  "overall_score": 0,
  "summary_feedback": "",
  "strong_points": [
    {
      "timestamp": "",
      "quote": "",
      "explanation": ""
    }
  ],
  "needs_focus": [
    {
      "timestamp": "",
      "quote": "",
      "explanation": ""
    }
  ],
  "heatmap": [
    {
      "label": "",
      "score": 0,
      "duration_seconds": 0
    }
  ],
  "duration": ""
}

Rules:
- Scores must be integers from 0 to 100.
- strong_points must have 1 or 2 items.
- needs_focus must have 1 or 2 items.
- heatmap must have 3 to 5 segments.
- Make the heatmap represent the full speech from start to finish.
- duration must match the total speech length as mm:ss.
- Base the analysis only on the transcript content.
- Keep explanations concise and useful.
- Use estimated timestamps if needed.

Total speech duration in seconds: ${durationSeconds}

Transcript:
${transcript}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  console.log("RAW GEMINI RESPONSE:");
  console.log(text);

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseError) {
    console.error("GEMINI JSON PARSE ERROR:", parseError);
    console.error("CLEANED GEMINI TEXT:", cleaned);
    throw new Error("Gemini returned invalid JSON");
  }
}

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("ANALYZE ROUTE HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const sttData = await transcribeWithElevenLabs(req.file);
    const transcript = sttData.text || "No transcript returned";

    console.log("TRANSCRIPT READY FOR GEMINI:");
    console.log(transcript);

    const analysis = await analyzeWithGemini(
      transcript,
      sttData.audio_duration_secs || 0
    );

    return res.json({
      transcript,
      ...analysis
    });
  } catch (error) {
    console.error("Analyze error:", error);
    return res.status(500).json({
      error: "Failed to analyze speech"
    });
  }
});

app.listen(3000, () => {
  console.log("AI SERVER running on http://localhost:3000");
});