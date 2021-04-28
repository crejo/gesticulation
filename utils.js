/**
 * GENERAL
 * =======
 */
function linkButtonIdToCallback(
    buttonId, callbackFunction, callbackArgs = []
) {
    const ButtonElement = document.getElementById(buttonId)
    ButtonElement.addEventListener('click', () => {
        callbackFunction(...callbackArgs)
    });
}

function downloadFrameFrom(canvasOrVideoElement, frameNum = 0) {
    // Allow multiple downloads in chrome for this to work
    var link = document.createElement('a');
    link.download = 'frame' + frameNum + '.png';
    link.href = canvasOrVideoElement.toDataURL()
    link.click();
}

function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

async function setupCamera(videoElement, width, height) {
    const constraints = { video: { width: width, height: height }, audio: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    return new Promise(resolve => {
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            resolve();
        };
    });
}

async function enableWebcam(width = 224, height = 224) {
    // mutates `videoElement` 
    await setupCamera(
        videoElement = document.getElementById("input"),
        width = width,
        height = height
    )
}

function roughSizeOfObject(object) {

    var objectList = [];
    var stack = [object];
    var bytes = 0;

    while (stack.length) {
        var value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        }
        else if (typeof value === 'string') {
            bytes += value.length * 2;
        }
        else if (typeof value === 'number') {
            bytes += 8;
        }
        else if
            (
            typeof value === 'object'
            && objectList.indexOf(value) === -1
        ) {
            objectList.push(value);

            for (var i in value) {
                stack.push(value[i]);
            }
        }
    }
    return bytes;
}

/**
 * ML RELATED
 * ==========
 */

function getRawHandCoordinates(leftHandLandmarks, rightHandLandmarks) {
    const numKeyPoints = 21
    if ((leftHandLandmarks !== undefined) || (rightHandLandmarks != undefined)) {
        // rightHandLandmarks come first and then comes leftHand in training data
        // and landmarkNotAvailable are present right after each coordinate:
        //      rightHandLandmarksX0
        //      rightHandLandmarksY0
        //      rightHandLandmarksZ0
        //      rightHandLandmarksX0NotAvailable
        //      rightHandLandmarksY0NotAvailable
        //      rightHandLandmarksZ0NotAvailable
        //      rightHandLandmarksX1
        //      rightHandLandmarksY1
        //      rightHandLandmarksZ1
        //      rightHandLandmarksX1NotAvailable
        //      rightHandLandmarksY1NotAvailable
        //      rightHandLandmarksZ1NotAvailable
        //      ...
        var keyPoints = []

        if (rightHandLandmarks === undefined) {
            for (i = 0; i < numKeyPoints; i++) {
                keyPoints.push(0) // for rightHandLandmarksCN
                keyPoints.push(0) // for rightHandLandmarksCN
                keyPoints.push(0) // for rightHandLandmarksCN
                keyPoints.push(1) // for rightHandLandmarksCNNotAvailable
                keyPoints.push(1) // for rightHandLandmarksCNNotAvailable
                keyPoints.push(1) // for rightHandLandmarksCNNotAvailable
            }
        } else {
            for (i = 0; i < rightHandLandmarks.length; i++) {
                var [x, y, z] = [rightHandLandmarks[i].x, rightHandLandmarks[i].y, rightHandLandmarks[i].z]
                keyPoints.push(x) // for rightHandLandmarksXN
                keyPoints.push(y) // for rightHandLandmarksYN
                keyPoints.push(z) // for rightHandLandmarksZN
                keyPoints.push(0) // for rightHandLandmarksXNNotAvailable
                keyPoints.push(0) // for rightHandLandmarksYNNotAvailable
                keyPoints.push(0) // for rightHandLandmarksZNNotAvailable
            }
        }

        if (leftHandLandmarks === undefined) {
            for (i = 0; i < numKeyPoints; i++) {
                keyPoints.push(0) // for leftHandLandmarksCN
                keyPoints.push(0) // for leftHandLandmarksCN
                keyPoints.push(0) // for leftHandLandmarksCN
                keyPoints.push(1) // for leftHandLandmarksCNNotAvailable
                keyPoints.push(1) // for leftHandLandmarksCNNotAvailable
                keyPoints.push(1) // for leftHandLandmarksCNNotAvailable
            }
        } else {
            for (i = 0; i < leftHandLandmarks.length; i++) {
                var [x, y, z] = [leftHandLandmarks[i].x, leftHandLandmarks[i].y, leftHandLandmarks[i].z]
                keyPoints.push(x) // for leftHandLandmarksXN
                keyPoints.push(y) // for leftHandLandmarksYN
                keyPoints.push(z) // for leftHandLandmarksZN
                keyPoints.push(0) // for leftHandLandmarksXNNotAvailable
                keyPoints.push(0) // for leftHandLandmarksYNNotAvailable
                keyPoints.push(0) // for leftHandLandmarksZNNotAvailable
            }
        }
        //console.log(keyPoints.length)
        return keyPoints
    }
}