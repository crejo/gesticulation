tf.env().set('WEBGL_CPU_FORWARD', true);

const consoleElement = document.getElementById('console')
const videoElement = document.getElementById("input-video")
const canvasElement = document.getElementById('output-canvas')
const canvasCtx = canvasElement.getContext('2d')
const collectedFrameNumElement = document.getElementById('frame-number')
const collectedDataSizeElement = document.getElementById('accumulator-size')
const gestureType = document.getElementById('gesture-type')
const playerName = document.getElementById('playerName')
const currentGestureType = document.getElementById('current-gesture-type')
const scoreWindow = document.getElementById('score-window')
const startDataCollectionBtn = document.getElementById('start-data-collection')
const stopDataCollectionBtn = document.getElementById('stop-data-collection')
const modelPrediction = document.getElementById('model-prediction')
const downloadBtn = document.getElementById('download-data')
const overallPlayerScoreConsole = document.getElementById('overall-player-score')


var collectDataFlag = true
var startingForFirstTime = true
var overallScoreUntilDownload = 0
let holistic, NNetGestureEstimator;
const mapGestureTypeToName = {
    'thumbs-up': 'Thumbs Up',
    'thumbs-down': 'Thumbs Down',
    'thumbs-edge-case': 'Thumbs Edge Case',
    'no-gesture-action': 'No Gesture Action'
}


let DataAccumulator = []
function collectData(frameData){
    DataAccumulator.push(frameData)
}

const onHolisticResults = (results) => {
    console.log(results.poseLandmarks)

    // draw on canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // drawImage
    const imageData = results.image.toDataURL()
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS,
            { color: '#eeeeeedc', lineWidth: 3 });
        drawLandmarks(canvasCtx, results.leftHandLandmarks,
            { color: '#eeeeeedc', lineWidth: 1 });
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS,
            { color: '#eeeeeedc', lineWidth: 3 });
        drawLandmarks(canvasCtx, results.rightHandLandmarks,
            { color: '#eeeeeedc', lineWidth: 1 });
    canvasCtx.restore();

    if ((results.leftHandLandmarks) || (results.rightHandLandmarks)){
        
        performNNetGestureRecognition(results)
        
        collectData({
            imageData: imageData,
            leftHandLandmarks: results.leftHandLandmarks,
            leftHandLandmarks: results.rightHandLandmarks
        })
    } else {
        modelPrediction.innerText = `0`
    }
}

const onClickStartDataCollection = async () => {


    if (gestureType.value === 'none'){
        alert('Please select the gesture type!')
        return
    }

    if (!playerName.value){
        alert('Please enter your nick name as player name!')
        return
    }

    collectDataFlag = true
    startDataCollectionBtn.disabled = true;
    stopDataCollectionBtn.disabled = false;
    gestureType.disabled = true;
    currentGestureType.innerText = mapGestureTypeToName[gestureType.value]

    if (startingForFirstTime){
        consoleElement.innerText = "Setting up Camera ..."
        // mutates `videoElement` 
        await setupCamera(
            videoElement,
            width = videoElement.width,
            height = videoElement.height
        )
    }

    consoleElement.innerText = startingForFirstTime

    if (startingForFirstTime){
        consoleElement.innerText = "Loading Models (This can take some time) ...."
        
        // custom models
        NNetGestureEstimator = await tf.loadLayersModel("https://cdn.jsdelivr.net/gh/rakesh4real/crejo-hosted-thumb-model-v0.0.3.2/model.json")
        
        // load model and configure
        holistic = new Holistic({
            locateFile: (file) => {
                // return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.1.1613603339/${file}`
                //return `saved_models/mediapipe_holistic_v0.1.1613603339/${file}`;
                return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.3.1620080860/${file}`;
            }
        });

        holistic.setOptions({
            upperBodyOnly: false,
            smoothLandmarks: true,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.8
        });

        holistic.onResults(onHolisticResults, consoleElement);
        await holistic.send({ image: videoElement });

        scoreWindow.classList.add('shown')
        consoleElement.innerText = "Model Loaded!"

        // finally,
        if (startingForFirstTime) {
            startingForFirstTime = false
        }
        updateParticleAnimation()
    }

    HOLISTIC_MODEL_FRAME_INTERVAL_FOR_INFERENCE = 5 // frames
    var frameCounter = -1
    async function renderFrame() {
        window.HOLISTIC_ANIM_FRAME_ID = requestAnimationFrame(renderFrame);
        frameCounter += 1
        if (((frameCounter % HOLISTIC_MODEL_FRAME_INTERVAL_FOR_INFERENCE) === 0)&&
            (collectDataFlag === true)
        ) {
            console.log(1)
            //collectedFrameNumElement.innerText = `${Math.round(frameCounter / HOLISTIC_MODEL_FRAME_INTERVAL_FOR_INFERENCE)} MB`
            collectedFrameNumElement.innerText = `${frameCounter / HOLISTIC_MODEL_FRAME_INTERVAL_FOR_INFERENCE} Frames`
            collectedDataSizeElement.innerText = `${Math.round(roughSizeOfObject(DataAccumulator) / 1024 / 1024 / 2)} MB`
            await holistic.send({ image: videoElement });
        }
    }

    renderFrame();
}

onStopDataCollectionClick = () => {
    startDataCollectionBtn.disabled = false;
    stopDataCollectionBtn.disabled = true;
    collectDataFlag = false;
    cancelAnimationFrame(window.HOLISTIC_ANIM_FRAME_ID)
}

linkButtonIdToCallback(
    buttonId="download-data",
    callbackFunction = () => {
        collectDataFlag = false
        downloadBtn.disabled = true;
        consoleElement.innerText = 'Download may take some time ...'
        downloadObjectAsJson(DataAccumulator, `${playerName.value}-score-${overallScoreUntilDownload/100}-samples-${DataAccumulator.length} ${new Date().toString()}`)
        
        DataAccumulator = []
        overallScoreUntilDownload = 0
        
        onStopDataCollectionClick()
    }
)

linkButtonIdToCallback(
    buttonId = "start-data-collection",
    callbackFunction = onClickStartDataCollection,
)

linkButtonIdToCallback(
    buttonId='stop-data-collection',
    callbackFunction = onStopDataCollectionClick
)