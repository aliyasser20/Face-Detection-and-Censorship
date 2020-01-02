// Select inputs //
const optionInputs = document.querySelectorAll(".controles input");

// Define options //
const options = {
  SIZE: 10,
  SCALE: 1
};

// Handle input function //
function handleInput(event) {
  const { name, value } = event.currentTarget;
  options[name] = Number(value);
}

// Add input event listner //
optionInputs.forEach(input => input.addEventListener("input", handleInput));

// Select video stream element //
const video = document.querySelector(".webcam");

// Select canvas that will include the video //
const videoCanvas = document.querySelector(".video");
const videoCtx = videoCanvas.getContext("2d");

// Select canvas that will include the face //
const faceCanvas = document.querySelector(".face");
const faceCtx = faceCanvas.getContext("2d");

// Create new face detector //
const faceDetector = new window.FaceDetector({ fastMode: true });

// Function that will populate videoCanvas with video stream //
async function populateVideo() {
  // Get stream from webcam //
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { height: 720, width: 720 }
  });

  // assign stream to video element //
  video.srcObject = stream;

  // Play video element //
  await video.play();

  // Size the canvases to the video height and width //
  videoCanvas.width = video.videoWidth;
  videoCanvas.height = video.videoHeight;
  faceCanvas.width = video.videoWidth;
  faceCanvas.height = video.videoHeight;
}

// Draw face function //
function drawFace(face) {
  const { width, height, x, y } = face.boundingBox;
  videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);

  videoCtx.beginPath();
  videoCtx.strokeStyle = "#d3b94e";
  videoCtx.lineWidth = 10;
  videoCtx.arc(
    x + width / 2,
    y + height / 2,
    (width / 2) * options.SCALE,
    0,
    2 * Math.PI
  );
  videoCtx.stroke();
}

// Censor face function //
function censor({ boundingBox: face }) {
  faceCtx.imageSmoothingEnabled = false;
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);

  // Draw very small face //
  faceCtx.drawImage(
    video,
    face.x,
    face.y,
    face.width,
    face.height,
    face.x + face.width / 2 - options.SIZE / 2,
    face.y + face.height / 2 - options.SIZE / 2,
    options.SIZE,
    options.SIZE
  );

  // Strech small image to fit area //
  faceCtx.save();
  faceCtx.beginPath();
  faceCtx.arc(
    face.x + face.width / 2,
    face.y + face.height / 2,
    (face.width / 2) * options.SCALE,
    0,
    2 * Math.PI
  );
  faceCtx.clip();

  faceCtx.drawImage(
    faceCanvas,
    face.x + face.width / 2 - options.SIZE / 2,
    face.y + face.height / 2 - options.SIZE / 2,
    options.SIZE,
    options.SIZE,
    face.x - (face.width * options.SCALE - face.width) / 2,
    face.y - (face.height * options.SCALE - face.height) / 2,
    face.width * options.SCALE,
    face.height * options.SCALE
  );

  faceCtx.restore();
}

// Face detection function //
async function faceDetect() {
  const faces = await faceDetector.detect(video);

  if (faces.length < 1) {
    videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  }

  faces.forEach(drawFace);
  faces.forEach(censor);
  requestAnimationFrame(faceDetect);
}

populateVideo().then(faceDetect);
