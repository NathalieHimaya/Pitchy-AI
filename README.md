# 🎤 Pitchy-AI

Pitchy-AI is a web-based application that enables users to submit pitches — either as live audio recordings or typed text — and receive AI-driven analysis, performance metrics, and an optional improved rewrite. The platform integrates Google Gemini for language understanding and pitch evaluation, and ElevenLabs for high-quality AI voice synthesis, allowing users to hear their pitch back in both its original and improved forms.

---

## 🚀 Features

* 🎙️ **Voice Recording** — Record your pitch directly in the browser using your microphone

* 📤 **Audio Upload** — Sends recorded audio to a backend server

* 🧠 **AI Processing (in progress)**

  * ElevenLabs → Speech-to-text transcription
  * Gemini → Pitch analysis and scoring

* 📊 **Analysis Dashboard** — Displays transcript and feedback

* 🔁 **Seamless Flow** — Recording → Processing → Results page

---

## 🧩 Tech Stack

### Frontend

* HTML
* CSS
* Tailwind CSS
* Vanilla JavaScript
* Browser APIs:

  * `MediaRecorder`
  * `getUserMedia`
  * `fetch`
  * `localStorage`

### Backend

* Node.js
* Express
* Multer
* CORS
* dotenv

### AI / APIs

* ElevenLabs (Speech-to-Text)
* Google Gemini (AI Feedback)

### Supporting Packages

* `node-fetch`
* `form-data`
* `@google/generative-ai`


## ⚙️ Setup Instructions

### 1. Clone the repo

```
git clone https://github.com/NathalieHimaya/Pitchy-AI.git
cd Pitchy-AI
```

### 2. Install dependencies

```
npm install
```

### 3. Create `.env` file

```
ELEVEN_API_KEY=your_elevenlabs_key
GEMINI_API_KEY=your_gemini_key
```

⚠️ Do not upload `.env` to GitHub

---

### 4. Start the backend server

```
node server.js
```

You should see:

```
Server running on http://localhost:3000
```

---

### 5. Run the frontend

Open `landing-page.html` using Live Server (extension on VS Code)

---