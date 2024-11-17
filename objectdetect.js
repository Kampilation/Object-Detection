const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const detectionsList = document.getElementById('detectionsList');
const statusDiv = document.getElementById('status');

let model = null;
let isDetecting = false;

// Load the COCO-SSD model
async function loadModel() {
    try {
        statusDiv.textContent = 'Loading model... This may take a moment.';
        model = await cocoSsd.load();
        statusDiv.textContent = 'Model loaded successfully! You can now start detection.';
        startBtn.disabled = false;
    } catch (err) {
        console.error('Failed to load model:', err);
        statusDiv.textContent = 'Error loading model. Please check console for details.';
    }
}

// Set up the video stream
async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (err) {
        console.error('Error accessing camera:', err);
        statusDiv.textContent = 'Error accessing camera. Please make sure you have granted camera permissions.';
    }
}

// Detect objects in the video stream
async function detectObjects() {
    if (!isDetecting) return;

    try {
        const predictions = await model.detect(video);

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear previous detections list
        detectionsList.innerHTML = '';

        // Draw new predictions
        predictions.forEach(prediction => {
            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                prediction.bbox[0],
                prediction.bbox[1],
                prediction.bbox[2],
                prediction.bbox[3]
            );

            // Draw label
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                prediction.bbox[0],
                prediction.bbox[1] - 20,
                prediction.bbox[2],
                20
            );
            ctx.fillStyle = '#000000';
            ctx.fillText(
                `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
                prediction.bbox[0] + 5,
                prediction.bbox[1] - 5
            );

            // Add to detections list
            const li = document.createElement('li');
            li.textContent = `${prediction.class} - Confidence: ${Math.round(prediction.score * 100)}%`;
            detectionsList.appendChild(li);
        });

        requestAnimationFrame(detectObjects);
    } catch (err) {
        console.error('Error during detection:', err);
        statusDiv.textContent = 'Error during detection. Please try restarting.';
    }
}

// Event listeners
startBtn.addEventListener('click', async () => {
    isDetecting = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusDiv.textContent = 'Detection running...';
    detectObjects();
});

stopBtn.addEventListener('click', () => {
    isDetecting = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    detectionsList.innerHTML = '';
    statusDiv.textContent = 'Detection stopped.';
});

// Initialize the application
async function init() {
    startBtn.disabled = true;
    await setupCamera();
    await loadModel();
}

// Start initialization after page load
window.addEventListener('load', init);