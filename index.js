var video = document.querySelector('video');
var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

// var ws = new WebSocket('ws://localhost:3000/');

// ws.on('connection', function open() {
//   ws.send('something');
// });

// ws.on('message', function incoming(data, flags) {
//   // flags.binary will be set if a binary data is received.
//   // flags.masked will be set if the data was masked.
// });


var CHUNK_AMOUNT = 39
var CHUNK_LENGTH = 2 // s
var CHUNK_SIZE = []
for (var i = 0; i <= 100; i++) {
    CHUNK_SIZE.push([0, 80, 110, 200, 300, 1024])
}

var STATUS = {
    chunk: 0,
    bufferedLength: 0,
    quality: 1
}

var mediaSource = new MediaSource;
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', sourceOpen);

// video.onwaiting = function() {
//     video.currentTime = video.currentTime + 0.05;
// }
video.ontimeupdate = function () {
    // console.log('ontimeupdate', video.currentTime)
}

function sourceOpen() {
    var mediaSource = this
    var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
    sourceBuffer.timestampOffset = 0;
    var end
    mediaSource.duration = 120

    var chunkLength = 2;
    var ws = new WebSocket('ws://localhost:3000')
    var nowChunk = 0
    var startTime, endTime, firstTime, lastTime, totalLength = 0
    ws.onopen = () => {
        firstTime = startTime = (new Date()).getTime()
        // ws.send(nowChunk.toString())
    }
    ws.onmessage = message => {
        console.log('message', (new Date()).getTime() - startTime)
        var reader = new FileReader();
        reader.onload = result => {
            console.log('reader', (new Date()).getTime() - startTime)
            var buf = result.target.result
            sourceBuffer.timestampOffset = chunkLength * nowChunk;
            endTime = (new Date()).getTime()
            totalLength += buf.byteLength
            console.log(buf.byteLength / 1024 / ((endTime - startTime) / 1000) + 'KB/s', buf.byteLength)
            console.log('average:', totalLength / 1024 / ((endTime - firstTime) / 1000) + 'KB/s')
            sourceBuffer.appendBuffer(buf);
            sourceBuffer.addEventListener("updateend", onUpdatedEnd);
            var endTime = (new Date()).getTime()
        }
        reader.readAsArrayBuffer(message.data);
    }

    function onUpdatedEnd() {
        console.log('updateend')
        nowChunk++
        startTime = (new Date()).getTime()
        ws.send(nowChunk.toString())
        sourceBuffer.removeEventListener("updateend", onUpdatedEnd)
    }
    function fetchChunk({ chunk, bufferedLength, quality }) {
        var startTime = (new Date()).getTime()
        return (new Promise((resolve, reject) => {
            fetchAB(`/video/chunk/q${quality}/chunk-${chunk}_dashinit.mp4`, function (buf) {
                sourceBuffer.timestampOffset = CHUNK_LENGTH * chunk;
                console.log('buf', buf)
                sourceBuffer.appendBuffer(buf);
                var endTime = (new Date()).getTime()
                console.log(buf.byteLength / 1024 / ((endTime - startTime) / 1000) + 'KB/s')
                resolve({
                    loadingTime: (endTime - startTime) / 1000,
                    speed: buf.byteLength / 1024 / ((endTime - startTime) / 1000),
                    quality: quality
                });
            })
        }))
    }

    var startTime = (new Date()).getTime()
    var promise = fetchChunk(STATUS)
    for (var i = 1; i <= CHUNK_AMOUNT; i++) {
        promise = promise.then(({ loadingTime, speed, quality }) => {
            STATUS.bufferedLength = STATUS.bufferedLength + CHUNK_LENGTH - loadingTime
            var nextStatus = {
                chunk: STATUS.chunk + 1,
                quality: getNextQuality2(STATUS, speed),
                bufferedLength: STATUS.bufferedLength
            }
            STATUS = nextStatus
            return fetchChunk(STATUS)
        })
    }
}

function fetchAB(url, cb) {
    console.log('\n')
    console.log('fetching...', url)
    var xhr = new XMLHttpRequest
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function () {
        cb(xhr.response)
    }
    xhr.send()
}

function getChunk() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest
        xhr.open('get', url)
        xhr.responseType = 'arraybuffer'
        xhr.onload = function () {
            cb(xhr.response)
        }
        xhr.send()
    })
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

var startStatus = {
    chunk: 1,
    bufferedLength: 0,
    quality: 1
}

function getNextQuality1(now) {
    if (now.bufferedLength <= CHUNK_LENGTH) {
        return 1
    }
    if (now.bufferedLength <= 2 * CHUNK_LENGTH) {
        return 2
    }
    if (now.bufferedLength <= 3 * CHUNK_LENGTH) {
        return 3
    }
    if (now.bufferedLength <= 4 * CHUNK_LENGTH) {
        return 4
    }
    return 5
}

function getNextQuality2(now, speed) {
    console.log(now, speed)
    var nextStatusArr = getNextStatus(now, speed)
    var allPath = []
    nextStatusArr.forEach(status => {
        allPath.push([now, status])
    })
    for (var i = 0; i < 5; i++) {
        var allPath = addNextPath(allPath, speed)
    }
    var allQoE = allPath.map(path => ({
        path: path,
        qoe: calculatePathQoE(path)
    }))
    var targetPath = _.maxBy(allQoE, 'qoe')
    return targetPath.path[1].quality
}

function getNextStatus(now, speed) {
    var result = []
    for (var quality = 1; quality <= 5; quality++) {
        if (now.chunk < CHUNK_AMOUNT) {
            result.push({
                chunk: now.chunk + 1,
                bufferedLength: now.bufferedLength + CHUNK_LENGTH - CHUNK_SIZE[now.chunk + 1][quality] / speed,
                quality: quality
            })
        }
    }
    return result
}

function addNextPath(nowPaths, speed) {
    var newPaths = []
    nowPaths.forEach(path => {
        var endStatus = path[path.length - 1]
        var nextStatusArr = getNextStatus(endStatus, speed)
        if (nextStatusArr.length > 0) {
            nextStatusArr.forEach(status => {
                if (status !== undefined) {
                    var tmp = [...path, status]
                } else {
                    var tmp = [...path]
                }
                newPaths.push(tmp)
            })
        } else {
            newPaths.push([...path])
        }
    })
    return newPaths
}

function calculatePathQoE(path) {
    // 平均码率
    var averageQuality = path.reduce((value, status) => value + status.quality, 0) / path.length
    var totalRateSwitch = 0
    path.forEach((s, i) => {
        if (i > 0) totalRateSwitch += Math.abs(s.quality - path[i - 1].quality)
    })
    var rebufferTime = 0
    path.forEach(s => {
        if (s.bufferedLength < 0) rebufferTime += Math.abs(s.bufferedLength)
    })
    return averageQuality * 1000 - totalRateSwitch * 50 - rebufferTime * 500
}