const raw = localStorage.getItem("pitchPalResults");
console.log("Raw localStorage value:", raw);

if (!raw) {
  alert("No analysis data found. Please record a pitch first.");
} else {
  const data = JSON.parse(raw);
  console.log("Parsed data:", data);

  // ── Element refs ──────────────────────────────────────────────────
  const overallScore            = document.getElementById("overallScore");
  const overallCircle           = document.getElementById("overallCircle");
  const overallExplanation      = document.getElementById("overallExplanation");      // page header subtitle
  const overallExplanationCard  = document.getElementById("overallExplanationCard");  // card beneath ring

  const clarityScore        = document.getElementById("clarityScore");
  const persuasivenessScore = document.getElementById("persuasivenessScore");
  const confidenceScore     = document.getElementById("confidenceScore");
  const flowScore           = document.getElementById("flowScore");

  const clarityBar        = document.getElementById("clarityBar");
  const persuasivenessBar = document.getElementById("persuasivenessBar");
  const confidenceBar     = document.getElementById("confidenceBar");
  const flowBar           = document.getElementById("flowBar");
  const hearPitchBtn                = document.getElementById("hearPitchBtn");
  const transcriptFeedbackContainer = document.getElementById("transcriptFeedbackContainer");

  // ── Safely extract fields ─────────────────────────────────────────
  const transcript      = data.transcript      || "No transcript available.";
  const clarity         = Number(data.clarity         || 0);
  const persuasiveness  = Number(data.persuasiveness  || 0);
  const confidence      = Number(data.confidence      || 0);
  const narrativeFlow   = Number(data.narrative_flow  || 0);
  const overall         = Number(data.overall_score   || 0);
  const summaryFeedback = data.summary_feedback || data.feedback || "No summary available.";
  const strongPoints    = Array.isArray(data.strong_points) ? data.strong_points : [];
  const needsFocus      = Array.isArray(data.needs_focus)   ? data.needs_focus   : [];

    if (hearPitchBtn) {
    hearPitchBtn.addEventListener("click", async () => {
      try {
        hearPitchBtn.disabled = true;
        hearPitchBtn.textContent = "Generating voice...";

        const res = await fetch("http://localhost:3000/generate-pitch-audio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            transcript
          })
        });

        const result = await res.json();
        console.log("TTS response:", result);

        if (!res.ok) {
          alert(result.error || "Failed to generate audio");
          hearPitchBtn.disabled = false;
          hearPitchBtn.innerHTML = `
            <span class="material-symbols-outlined" style="font-size:1.1rem; font-variation-settings:'FILL' 1;">mic</span>
            Hear How Your Pitch Could Sound Like
          `;
          return;
        }

        if (result.audioUrl) {
          const audio = new Audio(result.audioUrl);
          audio.play();
        }

        hearPitchBtn.disabled = false;
        hearPitchBtn.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:1.1rem; font-variation-settings:'FILL' 1;">mic</span>
          Hear How Your Pitch Could Sound Like
        `;
      } catch (error) {
        console.error("TTS button error:", error);
        alert("Could not generate pitch audio");
        hearPitchBtn.disabled = false;
        hearPitchBtn.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:1.1rem; font-variation-settings:'FILL' 1;">mic</span>
          Hear How Your Pitch Could Sound Like
        `;
      }
    });
  }

  // ── Scores ────────────────────────────────────────────────────────
  if (overallScore)           overallScore.textContent           = overall;
  if (overallExplanation)     overallExplanation.textContent     = summaryFeedback;
  if (overallExplanationCard) overallExplanationCard.textContent = summaryFeedback;

  if (clarityScore)        clarityScore.textContent        = `${clarity}%`;
  if (persuasivenessScore) persuasivenessScore.textContent = `${persuasiveness}%`;
  if (confidenceScore)     confidenceScore.textContent     = `${confidence}%`;
  if (flowScore)           flowScore.textContent           = `${narrativeFlow}%`;

  // ── Metric bars ───────────────────────────────────────────────────
  if (clarityBar)        clarityBar.style.width        = `${clarity}%`;
  if (persuasivenessBar) persuasivenessBar.style.width = `${persuasiveness}%`;
  if (confidenceBar)     confidenceBar.style.width     = `${confidence}%`;
  if (flowBar)           flowBar.style.width           = `${narrativeFlow}%`;

  // ── SVG score ring ────────────────────────────────────────────────
  if (overallCircle) {
    const circumference = 282.7;
    const offset = circumference - (overall / 100) * circumference;
    overallCircle.style.strokeDasharray  = `${circumference}`;
    overallCircle.style.strokeDashoffset = `${offset}`;
  }

  // ── Transcript + feedback bubbles ─────────────────────────────────
  if (transcriptFeedbackContainer) {
    transcriptFeedbackContainer.innerHTML = "";

    // Full transcript block at the top
    const transcriptBlock = document.createElement("div");
    transcriptBlock.innerHTML = `
      <p class="transcript-body">
        <span class="transcript-stamp">TRANSCRIPT</span>
        "${escapeHtml(transcript)}"
      </p>
    `;
    transcriptFeedbackContainer.appendChild(transcriptBlock);

    // Strong points — blue highlight + AI insight bubble
    strongPoints.forEach((item) => {
      const wrapper = document.createElement("div");

      wrapper.innerHTML = `
        <p class="transcript-body">
          <span class="transcript-stamp">${escapeHtml(item.timestamp || "00:00")}</span>
          <span class="highlight--primary">${escapeHtml(item.quote || "")}</span>
        </p>
        <div class="ai-bubble">
          <span class="ai-bubble__icon">
            <span class="material-symbols-outlined"
                  style="font-size:0.9rem; font-variation-settings:'FILL' 1;">auto_awesome</span>
          </span>
          <p class="ai-bubble__tag">AI Co-pilot Insight</p>
          <p class="ai-bubble__body">"${escapeHtml(item.explanation || "")}"</p>
        </div>
      `;

      transcriptFeedbackContainer.appendChild(wrapper);
    });

    // Needs focus — amber highlight + warning bubble
    needsFocus.forEach((item) => {
      const wrapper = document.createElement("div");

      wrapper.innerHTML = `
        <p class="transcript-body">
          <span class="transcript-stamp">${escapeHtml(item.timestamp || "00:00")}</span>
          <span class="highlight--warn">${escapeHtml(item.quote || "")}</span>
        </p>
        <div class="ai-bubble ai-bubble--warn">
          <span class="ai-bubble__icon ai-bubble__icon--warn">
            <span class="material-symbols-outlined"
                  style="font-size:0.9rem; font-variation-settings:'FILL' 1;">warning</span>
          </span>
          <p class="ai-bubble__tag ai-bubble__tag--warn">Improvement Area</p>
          <p class="ai-bubble__body">"${escapeHtml(item.explanation || "")}"</p>
        </div>
      `;

      transcriptFeedbackContainer.appendChild(wrapper);
    });
  }

}

// ── Helpers ───────────────────────────────────────────────────────────

function escapeHtml(text) {
  return String(text)
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#039;");
}