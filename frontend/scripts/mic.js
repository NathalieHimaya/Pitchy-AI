const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");

// ── New UI elements ──────────────────────────────────────────────────────────
const timerEl      = document.getElementById("recordingTimer");
const hintEl       = document.getElementById("recordingHint");
const waveformWrap = document.getElementById("waveformStatic");
const waveCanvas   = document.getElementById("waveformLive");

let mediaRecorder  = null;
let audioChunks    = [];
let isRecording    = false;

// Timer state
let timerInterval  = null;
let secondsElapsed = 0;

// Web Audio state
let audioCtx       = null;
let analyser       = null;
let micSource      = null;
let animFrameId    = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function startTimer() {
  secondsElapsed = 0;
  timerEl.textContent = formatTime(0);
  timerEl.classList.remove("hidden");
  timerInterval = setInterval(() => {
    secondsElapsed++;
    timerEl.textContent = formatTime(secondsElapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEl.classList.add("hidden");
}

// ── Canvas waveform ──────────────────────────────────────────────────────────
function startWaveform(stream) {
  audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
  analyser  = audioCtx.createAnalyser();
  analyser.fftSize = 256;

  micSource = audioCtx.createMediaStreamSource(stream);
  micSource.connect(analyser);

  // Hide the static decorative bars, show the live canvas
  waveformWrap.classList.add("hidden");
  waveCanvas.classList.remove("hidden");
  waveCanvas.style.display = "block";

  const bufferLength = analyser.frequencyBinCount; // 128
  const dataArray    = new Uint8Array(bufferLength);
  const ctx          = waveCanvas.getContext("2d");

  function draw() {
    animFrameId = requestAnimationFrame(draw);

    // Keep canvas sharp on hi-DPI screens
    const W = waveCanvas.clientWidth;
    const H = waveCanvas.clientHeight;
    if (waveCanvas.width !== W || waveCanvas.height !== H) {
      waveCanvas.width  = W;
      waveCanvas.height = H;
    }

    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, W, H);

    const barCount  = 48;
    const step      = Math.floor(bufferLength / barCount);
    const gap       = 4;
    const barW      = (W - gap * (barCount - 1)) / barCount;

    for (let i = 0; i < barCount; i++) {
      const value    = dataArray[i * step] / 255;           // 0–1
      const barH     = Math.max(4, value * H * 0.9);
      const x        = i * (barW + gap);
      const y        = (H - barH) / 2;                     // vertically centred

      // Colour: interpolate blue → bright-blue based on amplitude
      const alpha    = 0.35 + value * 0.65;
      ctx.fillStyle  = `rgba(60, 144, 255, ${alpha})`;

      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, barW / 2);
      ctx.fill();
    }
  }

  draw();
}

function stopWaveform() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx  = null;
    analyser  = null;
    micSource = null;
  }

  // Clear canvas and restore static bars
  if (waveCanvas) {
    const ctx = waveCanvas.getContext("2d");
    ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    waveCanvas.style.display = "";
    waveCanvas.classList.add("hidden");
  }
  waveformWrap.classList.remove("hidden");
}

// ── Recording state helpers ──────────────────────────────────────────────────
function setRecordingState(recording) {
  if (recording) {
    recordBtn.classList.add("recording-card__btn--active");
    hintEl.textContent = "Recording… click stop when finished";
    hintEl.style.color = "var(--color-on-primary-fixed)";
  } else {
    recordBtn.classList.remove("recording-card__btn--active");
    hintEl.textContent = "Click mic to start recording";
    hintEl.style.color = "";
  }
}

// ── Event listeners ──────────────────────────────────────────────────────────
recordBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  console.log("Button clicked. isRecording =", isRecording);

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mic stream acquired");

      mediaRecorder = new MediaRecorder(stream);
      audioChunks   = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Chunk received:", event.data.size);
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("onstop fired. Total chunks:", audioChunks.length);

        // Stop all mic tracks so the browser indicator light turns off
        stream.getTracks().forEach(t => t.stop());

        stopTimer();
        stopWaveform();
        setRecordingState(false);

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Blob created. Size:", audioBlob.size);
        await sendAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };

      mediaRecorder.start(250);
      isRecording = true;

      startTimer();
      startWaveform(stream);
      setRecordingState(true);

      console.log("Recording started");
    } catch (error) {
      console.error("Recording start error:", error);
      alert("Could not access microphone");
    }
  }
});

if (stopBtn) {
  stopBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isRecording) {
      console.log("Stopping recorder…");
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      isRecording = false;
      // Timer, waveform, and state reset happen inside onstop
    }
  });
}

// ── sendAudio ────────────────────────────────────────────────────────────────
async function sendAudio(audioBlob) {
  try {
    console.log("sendAudio called");
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    console.log("Sending request to server…");
    const res  = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      body: formData,
    });

    console.log("Response status:", res.status);
    const data = await res.json();
    console.log("Response JSON:", data);

    if (!res.ok) {
      alert(data.error || "Analysis failed");
      return;
    }

    localStorage.setItem("pitchPalResults", JSON.stringify(data));
    console.log("Saved to localStorage:", localStorage.getItem("pitchPalResults"));
    window.location.href = "analysis-page.html";
  } catch (error) {
    console.error("sendAudio error:", error);
    alert("Could not connect to server");
  }
}