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

  const transcriptFeedbackContainer = document.getElementById("transcriptFeedbackContainer");
  const durationText                = document.getElementById("durationText");
  const heatmapContainer            = document.getElementById("heatmapContainer");

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
  const heatmap         = Array.isArray(data.heatmap)       ? data.heatmap       : [];
  const duration        = data.duration || "00:00";

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

  // ── Duration label ────────────────────────────────────────────────
  if (durationText) {
    durationText.textContent = `Duration: ${duration}`;
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

  // ── Sentiment heatmap ─────────────────────────────────────────────
  if (heatmapContainer) {
    heatmapContainer.innerHTML = "";

    if (heatmap.length === 0) {
      // No heatmap data from Gemini — render a simple static fallback
      // based on the four dimension scores so the bar is never empty
      const segments = [
        { score: clarity,        label: "Clarity" },
        { score: persuasiveness, label: "Persuasiveness" },
        { score: confidence,     label: "Confidence" },
        { score: narrativeFlow,  label: "Narrative Flow" },
      ];

      segments.forEach((seg) => {
        const bar = document.createElement("div");
        bar.className    = "heatmap-bar__seg";
        bar.style.width  = "25%";
        bar.style.background = scoreToColor(seg.score);
        bar.title        = `${seg.label}: ${seg.score}%`;
        heatmapContainer.appendChild(bar);
      });
    } else {
      const totalDuration = heatmap.reduce(
        (sum, seg) => sum + Number(seg.duration_seconds || 0), 0
      );

      heatmap.forEach((segment) => {
        const score           = Number(segment.score || 0);
        const durationSeconds = Number(segment.duration_seconds || 0);
        const widthPct        = totalDuration > 0
          ? (durationSeconds / totalDuration) * 100
          : 100 / heatmap.length;

        const bar        = document.createElement("div");
        bar.className    = "heatmap-bar__seg";
        bar.style.width  = `${widthPct}%`;
        bar.style.background = scoreToColor(score);
        bar.title        = `${segment.label || "Segment"}: ${score}%`;
        heatmapContainer.appendChild(bar);
      });
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────
function scoreToColor(score) {
  if (score >= 80) return "var(--color-primary)";
  if (score >= 60) return "var(--color-primary-container)";
  if (score >= 40) return "var(--color-tertiary)";
  return "rgba(240,160,80,0.45)";
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&",  "&amp;")
    .replaceAll("<",  "&lt;")
    .replaceAll(">",  "&gt;")
    .replaceAll('"',  "&quot;")
    .replaceAll("'",  "&#039;");
}