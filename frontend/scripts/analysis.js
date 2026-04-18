const raw = localStorage.getItem("pitchPalResults");
console.log("Raw localStorage value:", raw);

if (!raw) {
  alert("No analysis data found");
} else {
  const data = JSON.parse(raw);
  console.log("Parsed data:", data);

// HOLY ELEMENTS
  const overallScore = document.getElementById("overallScore");
  const overallCircle = document.getElementById("overallCircle");
  const overallExplanation = document.getElementById("overallExplanation");

  const clarityScore = document.getElementById("clarityScore");
  const persuasivenessScore = document.getElementById("persuasivenessScore");
  const confidenceScore = document.getElementById("confidenceScore");
  const flowScore = document.getElementById("flowScore");

  const clarityBar = document.getElementById("clarityBar");
  const persuasivenessBar = document.getElementById("persuasivenessBar");
  const confidenceBar = document.getElementById("confidenceBar");
  const flowBar = document.getElementById("flowBar");

  const transcriptFeedbackContainer = document.getElementById("transcriptFeedbackContainer");
  const durationText = document.getElementById("durationText");
  const heatmapContainer = document.getElementById("heatmapContainer");

// Safeties
  const transcript = data.transcript || "No transcript available.";
  const clarity = Number(data.clarity || 0);
  const persuasiveness = Number(data.persuasiveness || 0);
  const confidence = Number(data.confidence || 0);
  const narrativeFlow = Number(data.narrative_flow || 0);
  const overall = Number(data.overall_score || 0);
  const summaryFeedback = data.summary_feedback || data.feedback || "No summary available.";
  const strongPoints = Array.isArray(data.strong_points) ? data.strong_points : [];
  const needsFocus = Array.isArray(data.needs_focus) ? data.needs_focus : [];
  const heatmap = Array.isArray(data.heatmap) ? data.heatmap : [];
  const duration = data.duration || "00:00";

// Scoring Text
  if (overallScore) overallScore.textContent = overall;
  if (overallExplanation) overallExplanation.textContent = summaryFeedback;

  if (clarityScore) clarityScore.textContent = `${clarity}%`;
  if (persuasivenessScore) persuasivenessScore.textContent = `${persuasiveness}%`;
  if (confidenceScore) confidenceScore.textContent = `${confidence}%`;
  if (flowScore) flowScore.textContent = `${narrativeFlow}%`;

// Score Bars
  if (clarityBar) clarityBar.style.width = `${clarity}%`;
  if (persuasivenessBar) persuasivenessBar.style.width = `${persuasiveness}%`;
  if (confidenceBar) confidenceBar.style.width = `${confidence}%`;
  if (flowBar) flowBar.style.width = `${narrativeFlow}%`;

// Circular Score
  if (overallCircle) {
    const circumference = 282.7;
    const offset = circumference - (overall / 100) * circumference;
    overallCircle.style.strokeDasharray = `${circumference}`;
    overallCircle.style.strokeDashoffset = `${offset}`;
  }

// Time/Duriation
  if (durationText) {
    durationText.textContent = `Duration: ${duration}`;
  }

// Transcript and Feedback
  if (transcriptFeedbackContainer) {
    transcriptFeedbackContainer.innerHTML = "";

    // Full transcript block
    const transcriptParagraph = document.createElement("p");
    transcriptParagraph.className = "text-lg leading-[2] text-on-surface-variant";
    transcriptParagraph.innerHTML = `
      <span class="text-slate-600 mr-4 font-mono text-sm inline-block w-20">TRANSCRIPT</span>
      "${escapeHtml(transcript)}"
    `;
    transcriptFeedbackContainer.appendChild(transcriptParagraph);

    // Strong points
    strongPoints.forEach((item) => {
      const quoteBlock = document.createElement("p");
      quoteBlock.className = "text-lg leading-[2] text-on-surface-variant";
      quoteBlock.innerHTML = `
        <span class="text-slate-600 mr-4 font-mono text-sm inline-block w-20">${escapeHtml(item.timestamp || "00:00")}</span>
        <span class="bg-primary/15 text-primary border-b-2 border-primary/40 px-1 py-1">
          ${escapeHtml(item.quote || "")}
        </span>
      `;
      transcriptFeedbackContainer.appendChild(quoteBlock);

      const insightBlock = document.createElement("div");
      insightBlock.className = "ml-16 bg-surface-container-high/50 p-6 rounded-2xl border-l-4 border-primary relative";
      insightBlock.innerHTML = `
        <span class="material-symbols-outlined absolute -left-4 top-6 bg-primary text-on-primary rounded-full p-1 text-sm">auto_awesome</span>
        <p class="text-sm font-bold text-primary mb-2">AI CO-PILOT INSIGHT</p>
        <p class="text-base text-on-surface italic">${escapeHtml(item.explanation || "")}</p>
      `;
      transcriptFeedbackContainer.appendChild(insightBlock);
    });

    // Needs focus
    needsFocus.forEach((item) => {
      const quoteBlock = document.createElement("p");
      quoteBlock.className = "text-lg leading-[2] text-on-surface-variant";
      quoteBlock.innerHTML = `
        <span class="text-slate-600 mr-4 font-mono text-sm inline-block w-20">${escapeHtml(item.timestamp || "00:00")}</span>
        <span class="bg-tertiary/15 text-tertiary border-b-2 border-tertiary/40 px-1 py-1">
          ${escapeHtml(item.quote || "")}
        </span>
      `;
      transcriptFeedbackContainer.appendChild(quoteBlock);

      const focusBlock = document.createElement("div");
      focusBlock.className = "ml-16 bg-surface-container-high/50 p-6 rounded-2xl border-l-4 border-tertiary relative";
      focusBlock.innerHTML = `
        <span class="material-symbols-outlined absolute -left-4 top-6 bg-tertiary text-on-tertiary-fixed rounded-full p-1 text-sm">warning</span>
        <p class="text-sm font-bold text-tertiary mb-2">IMPROVEMENT AREA</p>
        <p class="text-base text-on-surface italic">${escapeHtml(item.explanation || "")}</p>
      `;
      transcriptFeedbackContainer.appendChild(focusBlock);
    });
  }

// Heatmap might remove??
  if (heatmapContainer) {
    heatmapContainer.innerHTML = "";

    const totalDuration = heatmap.reduce((sum, segment) => {
      return sum + Number(segment.duration_seconds || 0);
    }, 0);

    heatmap.forEach((segment) => {
      const score = Number(segment.score || 0);
      const durationSeconds = Number(segment.duration_seconds || 0);

      const bar = document.createElement("div");
      bar.className = "h-full";

      const widthPercent =
        totalDuration > 0 ? (durationSeconds / totalDuration) * 100 : 0;

      bar.style.width = `${widthPercent}%`;

      // More blue = better, more orange = weaker
      if (score >= 80) {
        bar.classList.add("bg-primary");
      } else if (score >= 60) {
        bar.classList.add("bg-primary-container");
      } else if (score >= 40) {
        bar.classList.add("bg-tertiary");
      } else {
        bar.classList.add("bg-tertiary-container");
      }

      bar.title = `${segment.label || "Segment"}: ${score}%`;
      heatmapContainer.appendChild(bar);
    });
  }
}

//Helping stuff idk
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}