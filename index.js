var video = document.querySelector('video');
var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';

var mediaSource = new MediaSource;
video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', sourceOpen);

video.onwaiting = function() {
    video.currentTime = video.currentTime + 0.05;
}

function sourceOpen() {
    var mediaSource = this
    var sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
    var end
    mediaSource.duration = 120

    var chunkLength = 3;

    function fetchChunk(index, quality) {
        return new Promise((resolve, reject) => {
                fetchAB(`/video/chunk/${quality}/chunk-${index}_dashinit.mp4`, function(buf) {
                    sourceBuffer.timestampOffset = (chunkLength - 0.01) * index;
                    sourceBuffer.appendBuffer(buf);
                    resolve();
                })
            })
            .then(_ => delay(100))
            .then(getNextChunkQuality)
    }

    function getNextChunkQuality() {
        if (video.buffered.end(0)) {

        }
        return 'q5';
    }

    fetchChunk(0, getNextChunkQuality())
        .then(_ => fetchChunk(1, 'q1'))
        .then(_ => fetchChunk(2, 'q4'))
        .then(_ => fetchChunk(3, 'q2'))
        .then(_ => fetchChunk(4, 'q5'))
}

function fetchAB(url, cb) {
    console.log('fetching...', url)
    var xhr = new XMLHttpRequest
    xhr.open('get', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function() {
        cb(xhr.response)
    }
    xhr.send()
}

function getChunk() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest
        xhr.open('get', url)
        xhr.responseType = 'arraybuffer'
        xhr.onload = function() {
            cb(xhr.response)
        }
        xhr.send()
    })
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}