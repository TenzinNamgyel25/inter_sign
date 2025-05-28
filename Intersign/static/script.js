const cameraVideo = document.getElementById("camera");
const cameraFallback = document.getElementById("camera-fallback");
const startButton = document.getElementById("start-camera");
const stopButton = document.getElementById("stop-camera");
const detectedSigns = document.getElementById("detected-signs");
const interpretationText = document.getElementById("interpretation-text");
const backspaceButton = document.getElementById("backspace-text");

let stream;
let captureInterval;
let windowInterval;

let predictionWindow = [];
let finalTokens = []; // store tokens (letters, phrases, or spaces)

const customLabelMap = {
  'Hi_There': 'hi there',
  'Thank_You': 'thank you',
  'Sorry': 'sorry',
  'Help': 'help',
  'How_Are_You': 'how are you',
  'I_Am': 'i am',
  'Fine': 'fine',
  'I_Love_You': 'i love you',
  'Space_Bar': ' ',
  'Good_Bye': 'good bye'
};

function mapCustomLabel(label) {
  return customLabelMap[label] || label.toLowerCase();
}

function renderFinalSentence() {
  // Join tokens into string:
  // - Join tokens directly (letters and phrases),
  //   add spaces between tokens only if token isn't space itself.
  // To avoid double spaces, handle carefully.
  
  let sentence = "";
  for (let i = 0; i < finalTokens.length; i++) {
    const token = finalTokens[i];
    if (token === ' ') {
      // add a space if last char isn't space
      if (sentence.slice(-1) !== ' ') {
        sentence += ' ';
      }
    } else {
      // token is letter or phrase
      if (sentence.length > 0 && sentence.slice(-1) !== ' ') {
        // Add a space before phrase if next token is a phrase and not letter (optional)
        // Actually we won't add space here for letters, only if previous token was phrase
        // We handle spacing with spaces explicitly via Space_Bar, so just concat token directly
        sentence += token;
      } else {
        sentence += token;
      }
    }
  }
  
  // Capitalize first letter only
  if (sentence.length > 0) {
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }
  
  interpretationText.textContent = sentence;
}

async function captureAndStoreFrame() {
  if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) return;

  const canvas = document.createElement("canvas");
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  const context = canvas.getContext("2d");
  context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);

  const base64Image = canvas.toDataURL("image/jpeg");

  try {
    const response = await fetch("https://inter-sign.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });

    const result = await response.json();
    const sign = result.predicted_sign;

    if (sign && sign !== "No hand detected") {
      predictionWindow.push(sign);
      detectedSigns.textContent = sign;
    } else {
      detectedSigns.textContent = "No sign detected";
    }
  } catch (error) {
    console.error("Prediction error:", error);
  }
}

function getMostFrequentSign(signs) {
  const freq = {};
  for (const sign of signs) {
    freq[sign] = (freq[sign] || 0) + 1;
  }

  let maxSign = null;
  let maxCount = 0;
  for (const sign in freq) {
    if (freq[sign] > maxCount) {
      maxCount = freq[sign];
      maxSign = sign;
    }
  }
  return maxSign;
}

startButton.addEventListener("click", async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });

    cameraVideo.srcObject = stream;
    cameraFallback.style.display = "none";
    startButton.disabled = true;
    stopButton.disabled = false;

    predictionWindow = [];
    finalTokens = [];
    interpretationText.textContent = "";

    // Capture frame every 0.5 second
    captureInterval = setInterval(captureAndStoreFrame, 500);

    // Process prediction window every 5 seconds
    windowInterval = setInterval(() => {
      if (predictionWindow.length > 0) {
        const mostFrequent = getMostFrequentSign(predictionWindow);
        let mappedLabel = mapCustomLabel(mostFrequent);

        if (mappedLabel === ' ') {
          finalTokens.push(' ');
        } else {
          if (mappedLabel.length === 1) {
            // letter - just push without spaces
            finalTokens.push(mappedLabel);
          } else {
            // phrase - push phrase; spacing handled via spaces or concatenation
            finalTokens.push(mappedLabel);
          }
        }

        renderFinalSentence();
        predictionWindow = [];
      }
    }, 5000);

  } catch (err) {
    console.error("Error accessing camera:", err);
    alert("Could not access the camera. Please check permissions.");
  }
});

stopButton.addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach((track) => {
      if (track.readyState === "live") track.stop();
    });
    stream = null;
  }

  clearInterval(captureInterval);
  clearInterval(windowInterval);

  predictionWindow = [];
  finalTokens = [];
  interpretationText.textContent = "";
  detectedSigns.textContent = "";

  cameraVideo.srcObject = null;
  cameraFallback.style.display = "block";

  startButton.disabled = false;
  stopButton.disabled = true;
});

document.getElementById("clear-text").addEventListener("click", () => {
  detectedSigns.textContent = "";
  interpretationText.textContent = "";
  predictionWindow = [];
  finalTokens = [];
});

backspaceButton.addEventListener("click", () => {
  if (finalTokens.length > 0) {
    finalTokens.pop();
    renderFinalSentence();
  }
});

document.getElementById("copy-text").addEventListener("click", () => {
  const text = interpretationText.textContent;
  navigator.clipboard
    .writeText(text)
    .then(() => alert("Text copied to clipboard!"))
    .catch((err) => alert("Failed to copy text: " + err));
});
