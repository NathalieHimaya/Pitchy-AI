const recordBtn = document.getElementById("recordBtn");
const stopBtn = document.getElementById("stopBtn");

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

window.addEventListener("beforeunload", () => {
  console.log("PAGE IS RELOADING");
});

recordBtn.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopPropagation();

  console.log("Button clicked. isRecording =", isRecording);

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Mic stream acquired");

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log("Chunk received:", event.data.size);
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("onstop fired");
        console.log("Total chunks:", audioChunks.length);

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Blob created. Size:", audioBlob.size);

        await sendAudio(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
      };

      mediaRecorder.start(250);
      console.log("Recording started");

      isRecording = true;
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
      console.log("Stopping recorder...");
      console.log("Recorder state before stop:", mediaRecorder?.state);

      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }

      isRecording = false;
    }
  });
}

async function sendAudio(audioBlob) {
  try {
    console.log("sendAudio called");

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    console.log("Sending request to server...");

    const res = await fetch("http://localhost:3000/analyze", {
      method: "POST",
      body: formData
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