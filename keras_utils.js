// const KERAS_THUMBS_MODEL_THRESH = 0.9;

let NNetColMaxTensors, NNetColMinTensors;
const creatColMinMaxTensors = async() =>{
    const min = await (await fetch("./saved_models/thumb_detection_v0.0.2/colMinForStdJSON.json")).json()
    const max = await (await fetch("./saved_models/thumb_detection_v0.0.2/colMaxForStdJSON.json")).json()
    NNetColMaxTensors = tf.tensor1d(max)
    NNetColMinTensors = tf.tensor1d(min)
}

creatColMinMaxTensors()

const mapGestureTypeToNNClass = {
    'thumbs-up': 1,
    'thumbs-down': 0,
    'thumbs-edge-case': 3,
    'no-gesture-action': 2
}
 

async function makeKerasPrediction(coords) {
    const input = await tf.tidy(() => {
        const tensor = tf.tensor1d(coords)
        const scaledTensor = (tensor.sub(NNetColMinTensors)).div((NNetColMaxTensors.sub(NNetColMinTensors)))
        const clippedTensor = scaledTensor.clipByValue(0, 1) // To make sure REALLY in the distribution
        return tf.expandDims(clippedTensor, 0)
    })
    const scores = await NNetGestureEstimator.predict(input).data()
    
    // some wierd logic i worte a while back:
    //const best = await tf.argMax(scores).data()
    //if (scores[best[0]] > KERAS_THUMBS_MODEL_THRESH) {
    //    return { label: best[0], conf: scores[best[0]] }
    //}
    //return { label: "random", conf: 1 }
    
    // best score only:
    // const best = await tf.argMax(scores).data()
    //return { label: best[0], conf: scores[best[0]] }

    // all scores
    return {0: scores[0], 1: scores[1], 2: scores[2], 3: scores[3]}
}


const performNNetGestureRecognition = async (results) => {
    var coods = getRawHandCoordinates(results.leftHandLandmarks, results.rightHandLandmarks)
    if (coods) {
        const preds = await makeKerasPrediction(coods)
        // for all scores:
        playerScore = 100 - Math.round(preds[mapGestureTypeToNNClass[gestureType.value]] * 100)
        modelPrediction.innerText = `${playerScore}`
        overallScoreUntilDownload += playerScore
        overallPlayerScoreConsole.innerText = `${Math.round(overallScoreUntilDownload / 100)} Pts.`

        // filtering for best scores:
        // // if ([0, 1].includes(preds.label)) { // (or)
        // if ([mapGestureTypeToNNClass[gestureType.value]].includes(preds.label)) {
        //     console.log(preds)
        //     consoleElement.innerText = `${preds.label} \n ${preds.conf}`
        // } else {
        //     consoleElement.innerText = ''
        // }
    }
}