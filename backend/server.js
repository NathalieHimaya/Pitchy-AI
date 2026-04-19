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
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`ELEVENLABS STT ATTEMPT ${attempt}`);

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

      const rawText = await response.text();
      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        data = { raw: rawText };
      }

      console.log("ElevenLabs response:", data);

      if (!response.ok) {
        throw new Error(
          data.detail ||
          data.message ||
          data.raw ||
          `Speech-to-text failed with status ${response.status}`
        );
      }

      return data;
    } catch (error) {
      lastError = error;
      console.error(`ElevenLabs STT attempt ${attempt} failed:`, error.message);

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

async function analyzeWithGemmaLocal(transcript, durationSeconds) { // If using gemini switch to analyzeWithGemini
  console.log("LOCAL GEMMA ANALYSIS STARTED");

  // // ----- ONLY WHEN USING GEMINI ------
  // const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 

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
  "duration": ""
}

Rules:
- Scores must be integers from 0 to 100.
- strong_points must have 1 or 2 items.
- needs_focus must have 1 or 2 items.
- duration must match the total speech length as mm:ss.
- Base the analysis only on the transcript content.
- Keep explanations concise and useful.
- Use estimated timestamps if needed.

Total speech duration in seconds: ${durationSeconds}

Transcript:
${transcript}
`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gemma4:e2b",
      prompt,
      stream: false
    })
  });

  const data = await response.json();
  console.log("OLLAMA RESPONSE:", data);

  if (!response.ok || data.error) {
    throw new Error(data.error || "Ollama request failed");
  }

  if (!data.response) {
    throw new Error("Ollama did not return a response field");
  }

  const text = data.response.trim();;
// ----- ONLY WHEN USING GEMINI ------
  // const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

if (!jsonMatch) {
  console.error("NO JSON FOUND IN GEMMA RESPONSE");
  throw new Error("Invalid Gemma output");
}

const cleaned = jsonMatch[0];

  return JSON.parse(cleaned);
}

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    console.log("ANALYZE ROUTE HIT");

    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const sttData = await transcribeWithElevenLabs(req.file);
    const transcript = sttData.text || "No transcript returned";

    console.log("TRANSCRIPT READY FOR GEMMA/GEMINI:");
    console.log(transcript);

    const analysis = await analyzeWithGemmaLocal (
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
      error: error.message || "Failed to analyze speech"
    });
  }
});

app.post("/generate-pitch-audio", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required" });
    }

    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/pqHfZKP75CvOlQylNhV4", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVEN_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: transcript,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75
        }
      })
    });
    
// Eleven Labs Voice
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS error:", errorText);
      return res.status(500).json({ error: "Failed to generate pitch audio" });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return res.json({
      audioUrl: `data:audio/mpeg;base64,${base64Audio}`
    });
  } catch (error) {
    console.error("TTS route error:", error);
    return res.status(500).json({ error: "Failed to generate pitch audio" });
  }
});

app.listen(3000, () => {
  console.log("AI SERVER running on http://localhost:3000");
});


// ----- ONLY WHEN USING GEMINI ------
  // const result = await model.generateContent(prompt);
  // const text = result.response.text().trim();

  // console.log("RAW GEMINI RESPONSE:");
  // console.log(text);

  // const cleaned = text
  //   .replace(/```json/gi, "")
  //   .replace(/```/g, "")
  //   .trim();

  // try {
  //   return JSON.parse(cleaned);
  // } catch (parseError) {
  //   console.error("GEMINI JSON PARSE ERROR:", parseError);
  //   console.error("CLEANED GEMINI TEXT:", cleaned);
  //   throw new Error("Gemini returned invalid JSON");
  // }